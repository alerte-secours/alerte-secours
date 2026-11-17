// iOS simulator counterparts of helpers/ui.js (which drives Android through
// adb and uiautomator). Runs in the Jest (node) process, on the Mac that
// hosts the simulator.
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_TIMEOUT_MS = 20_000;

// "<lon> <lat>", same convention as helpers/ui.js. Default: Paris (staging).
const [LON, LAT] = (process.env.E2E_GEO_FIX || "2.3522 48.8566")
  .split(" ")
  .map(Number);

const METRO_URL = process.env.E2E_METRO_URL || "http://localhost:8081";

// Optional: directory receiving one PNG per `screenshot(name)` call.
const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "";

const LAUNCH_ARGS = {
  // The app is never idle (websockets, live timers, map animations): Detox
  // synchronization is disabled, helpers rely on explicit waits.
  detoxEnableSynchronization: 0,
  // Debug builds embed expo-dev-client: "--initialUrl <url>" makes it load
  // the bundle from Metro instead of showing its launcher. Ignored by
  // release builds.
  "-initialUrl": METRO_URL,
  // Read through NSUserDefaults' argument domain: hides the dev menu's
  // first-launch onboarding sheet, which would cover the app.
  EXDevMenuIsOnboardingFinished: "YES",
};

// Pre-granted so the permission wizard resolves without system dialogs,
// which live outside the app process.
const PERMISSIONS = {
  location: "always",
  notifications: "YES",
  microphone: "YES",
  motion: "YES",
};

function simctl(...args) {
  return execFileSync("xcrun", ["simctl", ...args], {
    timeout: 30_000,
  }).toString();
}

function setSimulatorLocation() {
  simctl("location", device.id, "set", `${LAT},${LON}`);
}

function screenshot(name) {
  if (!SCREENSHOT_DIR) return;
  try {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    simctl(
      "io",
      device.id,
      "screenshot",
      path.join(SCREENSHOT_DIR, `${name}.png`),
    );
  } catch (e) {
    console.warn(`screenshot ${name} failed: ${e.message}`);
  }
}

async function launchAppFresh() {
  await device.launchApp({
    newInstance: true,
    delete: true,
    permissions: PERMISSIONS,
    launchArgs: LAUNCH_ARGS,
  });
  // After the launch: Detox boots the simulator on demand.
  setSimulatorLocation();
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function byId(id) {
  return element(by.id(id));
}

async function waitForVisibleById(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitFor(byId(id)).toBeVisible().withTimeout(timeoutMs);
}

async function isVisibleById(id, timeoutMs = 1_500) {
  try {
    await waitForVisibleById(id, timeoutMs);
    return true;
  } catch (_e) {
    return false;
  }
}

async function tapById(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await tapWhenHittable(by.id(id), `id "${id}"`, timeoutMs);
}

/**
 * by.text / by.label can match several nodes (screens kept mounted behind
 * the current one): returns the first match that is actually visible.
 */
async function findVisible(matcher, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    for (let index = 0; index < 3; index++) {
      const candidate = element(matcher).atIndex(index);
      try {
        await waitFor(candidate).toBeVisible().withTimeout(300);
        return candidate;
      } catch (_e) {
        // try the next match
      }
    }
    if (Date.now() > deadline) return null;
  }
}

/**
 * Taps the first visible match. A visible element can still refuse the tap
 * for a moment (a native alert fading out, a LogBox toast over it): retry
 * until the deadline.
 */
async function tapWhenHittable(matcher, description, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  for (;;) {
    const found = await findVisible(matcher, 1_000);
    if (found) {
      try {
        await found.tap();
        return;
      } catch (e) {
        lastError = e;
        await dismissLogBoxToast();
      }
    }
    if (Date.now() > deadline) {
      throw (
        lastError ||
        new Error(`${description} not visible within ${timeoutMs}ms`)
      );
    }
    await sleep(300);
  }
}

async function waitForVisibleByText(text, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!(await findVisible(by.text(text), timeoutMs))) {
    throw new Error(`text "${text}" not visible within ${timeoutMs}ms`);
  }
}

async function isVisibleByText(text, timeoutMs = 1_500) {
  return !!(await findVisible(by.text(text), timeoutMs));
}

async function tapByText(text, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await tapWhenHittable(by.text(text), `text "${text}"`, timeoutMs);
}

async function maybeTapByText(text, timeoutMs = 1_500) {
  const found = await findVisible(by.text(text), timeoutMs);
  if (!found) return false;
  try {
    await found.tap();
    return true;
  } catch (_e) {
    return false;
  }
}

async function waitForVisibleByLabel(label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!(await findVisible(by.label(label), timeoutMs))) {
    throw new Error(`label "${label}" not visible within ${timeoutMs}ms`);
  }
}

async function isVisibleByLabel(label, timeoutMs = 1_500) {
  return !!(await findVisible(by.label(label), timeoutMs));
}

async function tapByLabel(label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await tapWhenHittable(by.label(label), `label "${label}"`, timeoutMs);
}

/**
 * Debug builds only: React warnings pop up as a LogBox toast over the bottom
 * of the screen, where the wizard's buttons and the chat input bar sit, and
 * it swallows the taps meant for them. Its row is labelled "<badge>, <text>"
 * and holds the dismiss cross at its right end.
 */
async function dismissLogBoxToast() {
  const toast = element(by.label(/^(!|\d+), [\s\S]+$/)).atIndex(0);
  try {
    const { frame } = await toast.getAttributes();
    await toast.tap({ x: frame.width - 22, y: frame.height / 2 });
    return true;
  } catch (_e) {
    return false; // no toast
  }
}

async function scrollDown(px = 400) {
  // Several scroll views are mounted at once (drawer, headers, the screen's
  // own): scroll the first one that accepts it. The gesture starts mid-height
  // to stay clear of bottom overlays.
  for (let index = 0; index < 6; index++) {
    try {
      await element(by.type("RCTEnhancedScrollView"))
        .atIndex(index)
        .scroll(px, "down", NaN, 0.5);
      return true;
    } catch (_e) {
      // off-screen, not scrollable or already at the bottom: try the next one
    }
  }
  return false;
}

async function scrollUntilVisibleById(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await isVisibleById(id, 700)) return;
    if (Date.now() > deadline) {
      throw new Error(`"${id}" not visible after scrolling ${timeoutMs}ms`);
    }
    if (!(await scrollDown(240))) {
      await sleep(500);
    }
  }
}

/**
 * Accepts the terms of use and walks through the permission wizard, until
 * the Send Alert screen is reachable. Generous deadline: on a fresh install
 * the first bundle is served by Metro.
 */
async function completeOnboardingIfPresent(timeoutMs = 300_000) {
  const deadline = Date.now() + timeoutMs;

  // Tap-priority order: forward actions first, then grant (permissions are
  // pre-granted at launch), then skip actions.
  const candidates = [
    "Accepter", // terms of use
    "Suivant",
    "Je suis prêt !",
    "Accepter et continuer", // background-location disclosure
    "J'accorde les permissions",
    "Passer cette étape",
    "Continuer",
    "Ignorer",
    "Désolé, mon chat a besoin de moi", // hero-mode skip
  ];

  while (Date.now() < deadline) {
    if (await isVisibleById("send-alert-cta-red", 1_000)) {
      return;
    }
    await dismissLogBoxToast();

    let tapped = false;
    for (const text of candidates) {
      if (await maybeTapByText(text, 300)) {
        console.log(`onboarding: tapped "${text}"`);
        tapped = true;
        break;
      }
    }
    if (tapped) {
      await sleep(700);
      continue;
    }

    // Buttons may be below the fold (terms of use, small screens).
    if (!(await scrollDown(500))) {
      await sleep(1_000);
    }
  }

  screenshot("onboarding-stuck");
  throw new Error(`Onboarding could not be completed within ${timeoutMs}ms`);
}

/**
 * Types and sends a chat text message, then closes the keyboard by tapping
 * the message in the list: while the keyboard is up, the first tap in the
 * message list only dismisses it and never reaches its target (the voice
 * message's play button, for instance).
 *
 * replaceText is fast but may not reach React's onChangeText: typeText is
 * the fallback when the send button does not replace the microphone.
 */
async function sendChatMessage(message) {
  await tapById("chat-input-text");
  await byId("chat-input-text").replaceText(message);
  if (!(await isVisibleById("chat-input-send", 3_000))) {
    await byId("chat-input-text").clearText();
    await byId("chat-input-text").typeText(message);
  }
  await tapById("chat-input-send");
  await tapByText(message, 60_000);
}

/**
 * A short spoken clip (AAC in an MP4 container, like the app's recordings),
 * generated with macOS' own tools. Returns its path and duration.
 */
function makeVoiceClip(sentence) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "as-e2e-audio-"));
  const aiff = path.join(dir, "clip.aiff");
  const m4a = path.join(dir, "clip.m4a");
  execFileSync("say", ["-o", aiff, sentence], { timeout: 60_000 });
  execFileSync("afconvert", ["-f", "m4af", "-d", "aac", aiff, m4a], {
    timeout: 60_000,
  });
  const info = execFileSync("afinfo", [m4a]).toString();
  const match = info.match(/estimated duration: ([\d.]+) sec/);
  if (!match) {
    throw new Error(`cannot read the clip duration from afinfo:\n${info}`);
  }
  return {
    path: m4a,
    seconds: parseFloat(match[1]),
    bytes: fs.statSync(m4a).size,
  };
}

/** "MM:SS", as the chat audio player displays durations. */
function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

module.exports = {
  LAT,
  LON,
  launchAppFresh,
  setSimulatorLocation,
  screenshot,
  sleep,
  waitForVisibleById,
  isVisibleById,
  tapById,
  waitForVisibleByText,
  isVisibleByText,
  tapByText,
  maybeTapByText,
  waitForVisibleByLabel,
  isVisibleByLabel,
  tapByLabel,
  dismissLogBoxToast,
  scrollDown,
  scrollUntilVisibleById,
  completeOnboardingIfPresent,
  sendChatMessage,
  makeVoiceClip,
  formatClock,
};
