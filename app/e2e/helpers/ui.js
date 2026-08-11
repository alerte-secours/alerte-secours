const { execSync } = require("child_process");

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Device prep that Detox cannot do through the app: battery-optimization
 * whitelist (avoids the system dialog during the wizard hero step) and a
 * deterministic location (Paris).
 */
function prepareAndroidDevice() {
  if (device.getPlatform() !== "android") return;
  const adb = `adb -s ${device.id}`;
  try {
    execSync(`${adb} shell dumpsys deviceidle whitelist +com.alertesecours`);
    // High-accuracy location pre-enabled: avoids the Play services
    // "Location Accuracy" consent dialog during the wizard.
    execSync(`${adb} shell settings put secure location_mode 3`);
    execSync(`${adb} shell cmd location set-location-enabled true`);
    execSync(`${adb} emu geo fix 2.3522 48.8566`);
  } catch (e) {
    // Non-fatal (tests fall back to wizard skip buttons) but must be visible.
    console.warn(`prepareAndroidDevice failed: ${e.message}`);
  }
}

// This app is never "idle" in the Espresso sense (websockets, live timers,
// map animations), so Detox synchronization would block every interaction.
// It is disabled globally; helpers rely on explicit waitFor(...).withTimeout.
const LAUNCH_ARGS = { detoxEnableSynchronization: 0 };

async function launchAppFresh() {
  await device.launchApp({
    newInstance: true,
    delete: true,
    launchArgs: LAUNCH_ARGS,
  });
  prepareAndroidDevice();
}

async function launchApp() {
  await device.launchApp({ newInstance: true, launchArgs: LAUNCH_ARGS });
  prepareAndroidDevice();
}

async function reloadApp() {
  await device.reloadReactNative();
}

function byId(id) {
  return element(by.id(id));
}

/**
 * Run a Detox wait, recovering from system dialogs (Play services location
 * accuracy, battery optimization…) that pause the app's activity and make
 * Espresso fail with "No activities in stage RESUMED" or hide the views.
 */
async function waitRecoveringFromSystemDialogs(runWait, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const step = Math.min(timeoutMs, 5_000);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await runWait(step);
      return;
    } catch (e) {
      if (Date.now() + step > deadline) {
        throw e;
      }
      tapSystemDialogButton();
      await sleep(500);
    }
  }
}

async function waitForVisibleById(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitRecoveringFromSystemDialogs(
    (step) => waitFor(byId(id)).toBeVisible().withTimeout(step),
    timeoutMs,
  );
}

async function waitForVisibleByText(text, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitRecoveringFromSystemDialogs(
    (step) =>
      waitFor(element(by.text(text)).atIndex(0)).toBeVisible().withTimeout(step),
    timeoutMs,
  );
}

async function expectVisibleById(id) {
  await expect(byId(id)).toBeVisible();
}

async function isVisibleById(id, timeoutMs = 1_500) {
  try {
    await waitForVisibleById(id, timeoutMs);
    return true;
  } catch (_e) {
    return false;
  }
}

async function isVisibleByText(text, timeoutMs = 1_500) {
  try {
    await waitForVisibleByText(text, timeoutMs);
    return true;
  } catch (_e) {
    return false;
  }
}

async function tapById(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitForVisibleById(id, timeoutMs);
  await byId(id).tap();
}

async function tapByText(text, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitForVisibleByText(text, timeoutMs);
  await element(by.text(text)).atIndex(0).tap();
}

async function tapByLabel(label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitRecoveringFromSystemDialogs(
    (step) =>
      waitFor(element(by.label(label)).atIndex(0))
        .toBeVisible()
        .withTimeout(step),
    timeoutMs,
  );
  await element(by.label(label)).atIndex(0).tap();
}

async function maybeTapByText(text, timeoutMs = 1_500) {
  if (await isVisibleByText(text, timeoutMs)) {
    try {
      await element(by.text(text)).atIndex(0).tap();
      return true;
    } catch (_e) {
      return false;
    }
  }
  return false;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * If a SYSTEM dialog (Play services location accuracy, battery
 * optimization…) covers the app, Detox cannot see nor tap it. Find an
 * affirmative button through uiautomator and tap it via adb.
 */
function tapSystemDialogButton() {
  const adb = `adb -s ${device.id}`;
  const labels = [
    "Turn on",
    "Activer",
    "Allow",
    "Autoriser",
    "While using the app",
    "Lors de l'utilisation de l'app",
    "OK",
  ];
  try {
    execSync(`${adb} shell uiautomator dump /sdcard/detox_ui.xml`, {
      timeout: 10_000,
    });
    const xml = execSync(`${adb} shell cat /sdcard/detox_ui.xml`, {
      timeout: 10_000,
    }).toString();
    for (const label of labels) {
      const re = new RegExp(
        `text="${label}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`,
      );
      const m = xml.match(re);
      if (m) {
        const x = Math.floor((parseInt(m[1], 10) + parseInt(m[3], 10)) / 2);
        const y = Math.floor((parseInt(m[2], 10) + parseInt(m[4], 10)) / 2);
        execSync(`${adb} shell input tap ${x} ${y}`);
        return true;
      }
    }
  } catch (e) {
    console.warn(`tapSystemDialogButton failed: ${e.message}`);
  }
  return false;
}

/**
 * Walk through the permission wizard if it is displayed.
 *
 * Detox installs the APK with all runtime permissions pre-granted, so the
 * "grant" step on the Welcome screen resolves without any system dialog.
 * On steps that would open system screens (hero mode / battery optimization),
 * prefer the skip/continue buttons to stay inside the app.
 */
async function completeOnboardingIfPresent() {
  const deadline = Date.now() + 90_000;

  // Buttons in tap-priority order: forward actions first, then grant (safe:
  // permissions are pre-granted and the battery-optimization whitelist is
  // applied by the test harness), then skip actions.
  const candidates = [
    "Suivant",
    "Je suis prêt !",
    "Accepter et continuer", // background-location disclosure
    "J'accorde les permissions",
    "Passer cette étape",
    "Continuer",
    "Ignorer",
    "Désolé, mon chat a besoin de moi", // hero-mode skip
  ];

  let stuckRounds = 0;
  while (Date.now() < deadline) {
    // System dialogs (Play services location accuracy, battery optimization…)
    // cover the app while Espresso still "sees" the app's own views — check
    // for them first, through uiautomator.
    if (tapSystemDialogButton()) {
      await sleep(1_500);
      continue;
    }

    // Done when the Send Alert screen is reachable.
    if (await isVisibleById("send-alert-cta-red", 1_000)) {
      return;
    }

    let tapped = false;
    for (const text of candidates) {
      if (await maybeTapByText(text, 1_000)) {
        tapped = true;
        break;
      }
    }

    if (tapped) {
      stuckRounds = 0;
      continue;
    }

    stuckRounds += 1;
    if (stuckRounds % 2 === 0) {
      // A system dialog may be covering the app: accept it through adb
      // (Detox cannot interact with other processes).
      if (tapSystemDialogButton()) {
        stuckRounds = 0;
        continue;
      }
    }
    {
      // Buttons may be below the fold on small screens: try scrolling down.
      try {
        await element(by.type("android.widget.ScrollView"))
          .atIndex(0)
          .scroll(500, "down");
      } catch (_e) {
        // Not scrollable (loading, transition…): wait and re-check.
        await sleep(1_000);
      }
    }
  }

  throw new Error("Onboarding wizard could not be completed within 90s");
}

/**
 * Tap an element through adb/uiautomator (content-desc or text match) —
 * bypasses Espresso for controls whose in-app taps are unreliable.
 */
function adbTapByLabel(label) {
  const adb = `adb -s ${device.id}`;
  let xml = null;
  // uiautomator dump intermittently fails while instrumentation runs: retry.
  for (let i = 0; i < 4 && xml === null; i++) {
    try {
      execSync(`${adb} shell uiautomator dump /sdcard/detox_ui.xml`, {
        timeout: 10_000,
      });
      xml = execSync(`${adb} shell cat /sdcard/detox_ui.xml`, {
        timeout: 10_000,
      }).toString();
    } catch (_e) {
      execSync("sleep 1");
    }
  }
  if (xml === null) {
    throw new Error("adbTapByLabel: uiautomator dump kept failing");
  }
  const re = new RegExp(
    `(?:content-desc|text)="${label}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`,
  );
  const m = xml.match(re);
  if (!m) {
    throw new Error(`adbTapByLabel: "${label}" not found on screen`);
  }
  const x = Math.floor((parseInt(m[1], 10) + parseInt(m[3], 10)) / 2);
  const y = Math.floor((parseInt(m[2], 10) + parseInt(m[4], 10)) / 2);
  execSync(`${adb} shell input tap ${x} ${y}`);
}

async function openDrawer() {
  await tapById("header-right-menu");
}

async function navigateToDrawerItem(label) {
  // The drawer content stays mounted off-screen, so the item "exists" even
  // when the drawer is closed: retry the toggle until the item is actually
  // visible, with an edge swipe as fallback.
  // by.text can match several nodes (drawer item + hidden screen titles):
  // probe a few indices for the one that is actually visible.
  const tapVisibleMatch = async (timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      for (let index = 0; index < 3; index++) {
        try {
          await waitFor(element(by.text(label)).atIndex(index))
            .toBeVisible()
            .withTimeout(700);
          await element(by.text(label)).atIndex(index).tap();
          return true;
        } catch (_e) {
          // try next index
        }
      }
    }
    return false;
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await openDrawer();
    } catch (_e) {
      // Menu button hidden (drawer already open?) — try the item directly.
    }
    if (await tapVisibleMatch(4_000)) {
      return;
    }
    // Item may be below the drawer fold: scroll the drawer content.
    for (let index = 0; index < 2; index++) {
      try {
        await element(by.type("android.widget.ScrollView"))
          .atIndex(index)
          .scroll(500, "down");
        break;
      } catch (_e) {
        // try next scroll view
      }
    }
    if (await tapVisibleMatch(2_000)) {
      return;
    }
    // Fallback: swipe from the right edge (drawer side in this app).
    try {
      await element(by.id("main-layout")).swipe("left", "fast", 0.7, 0.95);
    } catch (_e) {
      // ignore
    }
    if (await tapVisibleMatch(2_000)) {
      return;
    }
  }
  // Final attempt with a hard assertion for a useful error message.
  await tapByText(label, 5_000);
}

async function goBack() {
  if (await isVisibleById("header-left-back", 2_000)) {
    await tapById("header-left-back");
  } else {
    await device.pressBack();
  }
}

async function scrollUntilVisibleById(id, opts = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, stepPx = 240 } = opts;

  // Fast-path: already visible.
  try {
    await waitForVisibleById(id, 500);
    return;
  } catch (_e) {
    // Continue to scroll
  }

  const target = byId(id);

  // Detox needs an explicit scrollable element to drive scrolling.
  // This app uses RN ScrollView, which maps to different native class names.
  const scrollViews = [
    element(by.type("android.widget.ScrollView")),
    element(by.type("RCTScrollView")),
  ];

  const errors = [];
  for (const scrollView of scrollViews) {
    try {
      await waitFor(target)
        .toBeVisible()
        .whileElement(scrollView)
        .scroll(stepPx, "down");
      return;
    } catch (e) {
      errors.push(e);
    }
  }

  // Fall back to a direct wait to get a good assertion error.
  await waitForVisibleById(id, timeoutMs);
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  adbTapByLabel,
  byId,
  prepareAndroidDevice,
  completeOnboardingIfPresent,
  expectVisibleById,
  goBack,
  isVisibleById,
  isVisibleByText,
  launchApp,
  launchAppFresh,
  maybeTapByText,
  navigateToDrawerItem,
  openDrawer,
  reloadApp,
  scrollUntilVisibleById,
  sleep,
  tapById,
  tapByLabel,
  tapByText,
  waitForVisibleById,
  waitForVisibleByText,
};
