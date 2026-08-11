const {
  launchApp,
  completeOnboardingIfPresent,
  navigateToDrawerItem,
  waitForVisibleByText,
  waitForVisibleById,
  scrollUntilVisibleById,
  isVisibleById,
  goBack,
} = require("./helpers/ui");

// Drawer entries that push a screen we can assert on by a stable text, then
// navigate back from. Alert-related entries are covered by dedicated specs.
const DRAWER_SCREENS = [
  { label: "Mon Profil", expectText: null },
  { label: "Mes Proches", expectText: null },
  { label: "Paramètres", expectText: null },
  { label: "Ma Localisation", expectText: null },
  { label: "Numéros utiles", expectText: null },
  { label: "Signal d'appel à l'aide", expectText: null },
  { label: "Liens utiles", expectText: null },
  { label: "À Propos", expectText: null },
  { label: "Alertes archivées", expectText: null },
];

describe("Navigation (drawer)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  beforeEach(async () => {
    // Ensure we start from the Send Alert home screen, whatever the previous
    // test left on screen.
    for (let i = 0; i < 5; i++) {
      if (await isVisibleById("send-alert-cta-red", 2_000)) {
        return;
      }
      await goBack();
    }
    await launchApp();
    await scrollUntilVisibleById("send-alert-cta-red");
  });

  for (const { label, expectText } of DRAWER_SCREENS) {
    it(`opens "${label}" from the drawer and returns`, async () => {
      await navigateToDrawerItem(label);

      if (expectText) {
        await waitForVisibleByText(expectText);
      } else {
        // Screen is pushed: back button present, app did not crash.
        await waitForVisibleById("header-left-back");
      }

      await goBack();
      await scrollUntilVisibleById("send-alert-cta-red");
    });
  }
});
