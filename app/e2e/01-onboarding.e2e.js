const {
  launchAppFresh,
  completeOnboardingIfPresent,
  waitForVisibleById,
  scrollUntilVisibleById,
} = require("./helpers/ui");

describe("Onboarding (fresh install)", () => {
  beforeAll(async () => {
    await launchAppFresh();
  });

  it("walks through the permission wizard and lands on Send Alert", async () => {
    await completeOnboardingIfPresent();
    await waitForVisibleById("main-layout");
    await scrollUntilVisibleById("send-alert-cta-red");
  });

  it("exposes the primary Send Alert CTAs", async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
    await scrollUntilVisibleById("send-alert-cta-yellow");
    await scrollUntilVisibleById("send-alert-cta-green");
    await scrollUntilVisibleById("send-alert-cta-unknown");
    await scrollUntilVisibleById("send-alert-cta-call");
  });

  it("exposes the header quick actions", async () => {
    await waitForVisibleById("header-right-send-alert");
    await waitForVisibleById("header-right-alerts");
    await waitForVisibleById("header-right-current-alert");
    await waitForVisibleById("header-right-menu");
  });
});
