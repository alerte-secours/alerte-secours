const DEFAULT_TIMEOUT_MS = 20_000;

async function launchAppFresh() {
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: "YES",
      location: "never",
      microphone: "never",
    },
  });
}

async function reloadApp() {
  await device.reloadReactNative();
}

function byId(id) {
  return element(by.id(id));
}

async function waitForVisibleById(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  await waitFor(byId(id)).toBeVisible().withTimeout(timeoutMs);
}

async function expectVisibleById(id) {
  await expect(byId(id)).toBeVisible();
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
  byId,
  expectVisibleById,
  launchAppFresh,
  reloadApp,
  scrollUntilVisibleById,
  waitForVisibleById,
};

