const {
  launchAppFresh,
  reloadApp,
  scrollUntilVisibleById,
  waitForVisibleById,
} = require("./helpers/ui");

describe("A11y smoke (testID selectors)", () => {
  beforeAll(async () => {
    await launchAppFresh();
  });

  beforeEach(async () => {
    await reloadApp();
  });

  it("Send Alert screen exposes primary CTAs by testID", async () => {
    // On fresh install the app lands on the Send Alert tab.
    await scrollUntilVisibleById("send-alert-cta-red");
    await scrollUntilVisibleById("send-alert-cta-yellow");
    await scrollUntilVisibleById("send-alert-cta-green");
    await scrollUntilVisibleById("send-alert-cta-unknown");
    await scrollUntilVisibleById("send-alert-cta-call");
  });

  it("Header right quick actions exist by testID", async () => {
    await waitForVisibleById("header-right-send-alert");
    await waitForVisibleById("header-right-alerts");
    await waitForVisibleById("header-right-current-alert");
    await waitForVisibleById("header-right-menu");
  });

  it("Header controls adapt across a push navigation (menu -> overflow) via testID", async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
    await waitForVisibleById("header-right-menu");

    await element(by.id("send-alert-cta-red")).tap();

    // Confirmation screen should be pushed, showing a back button.
    await waitForVisibleById("header-left-back");
    await waitForVisibleById("header-right-overflow");
    await element(by.id("header-left-back")).tap();

    // Back on Send Alert screen.
    await waitForVisibleById("send-alert-cta-red");
    await waitForVisibleById("header-right-menu");
  });
});
