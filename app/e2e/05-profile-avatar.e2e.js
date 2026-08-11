const {
  launchApp,
  completeOnboardingIfPresent,
  navigateToDrawerItem,
  tapByLabel,
  tapByText,
  waitForVisibleByText,
  scrollUntilVisibleById,
  isVisibleByText,
  goBack,
  sleep,
} = require("./helpers/ui");

// Profile avatar flow — validates the Play-policy fix: the gallery must open
// the system photo picker directly, with NO permission dialog (the app no
// longer declares READ_MEDIA_IMAGES).
describe("Profile & avatar (system photo picker)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  beforeEach(async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
  });

  it("opens the avatar editor and selects the text avatar", async () => {
    await navigateToDrawerItem("Mon Profil");
    await tapByLabel("Modifier la photo de profil");
    await waitForVisibleByText("Photo de profil");

    await tapByLabel("Utiliser un avatar texte");
    await tapByText("OK");
    await goBack();
  });

  it("opens the system photo picker from the gallery button without any permission prompt", async () => {
    await navigateToDrawerItem("Mon Profil");
    await tapByLabel("Modifier la photo de profil");
    await waitForVisibleByText("Photo de profil");

    await tapByLabel("Choisir une photo dans la galerie");

    // The system photo picker (PickVisualMedia) is outside the app: our modal
    // text should no longer be visible. If a permission dialog appeared
    // instead, the picker would not open and the modal would still be there.
    await sleep(3_000);
    const modalStillVisible = await isVisibleByText("Photo de profil", 1_000);
    if (modalStillVisible) {
      throw new Error(
        "Gallery button did not open the system picker (permission prompt?)",
      );
    }

    // Come back to the app.
    await device.pressBack();
    await sleep(1_000);
    // Close the avatar modal.
    if (await isVisibleByText("Photo de profil", 2_000)) {
      await tapByText("Annuler");
    }
    await goBack();
  });
});
