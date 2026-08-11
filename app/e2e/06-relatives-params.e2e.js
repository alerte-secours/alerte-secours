const {
  launchApp,
  completeOnboardingIfPresent,
  navigateToDrawerItem,
  waitForVisibleById,
  scrollUntilVisibleById,
  goBack,
} = require("./helpers/ui");

describe("Relatives & settings screens", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  beforeEach(async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
  });

  it("opens Mes Proches (contacts permission already granted)", async () => {
    await navigateToDrawerItem("Mes Proches");
    await waitForVisibleById("header-left-back");
    await goBack();
  });

  it("opens Paramètres and navigates back", async () => {
    await navigateToDrawerItem("Paramètres");
    await waitForVisibleById("header-left-back");
    await goBack();
  });

  it("opens Ma Localisation (fallback location settings)", async () => {
    await navigateToDrawerItem("Ma Localisation");
    await waitForVisibleById("header-left-back");
    await goBack();
  });
});
