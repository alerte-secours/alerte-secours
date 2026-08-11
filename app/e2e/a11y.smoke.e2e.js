const {
  launchApp,
  completeOnboardingIfPresent,
  navigateToDrawerItem,
  scrollUntilVisibleById,
  waitForVisibleById,
  goBack,
} = require("./helpers/ui");

describe("A11y smoke (testID selectors)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  it("Header controls adapt across a push navigation (menu -> back) via testID", async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
    await waitForVisibleById("header-right-menu");

    // Push a screen through the drawer (the Send Alert CTAs place an
    // emergency call after their auto-confirm countdown — never tap them in
    // a test that lingers on the confirmation screen).
    await navigateToDrawerItem("Mon Profil");

    // Pushed screen shows a back button.
    await waitForVisibleById("header-left-back");
    await goBack();

    // Back on Send Alert screen.
    await scrollUntilVisibleById("send-alert-cta-red");
    await waitForVisibleById("header-right-menu");
  });
});
