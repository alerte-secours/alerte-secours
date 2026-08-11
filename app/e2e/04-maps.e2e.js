const {
  launchApp,
  completeOnboardingIfPresent,
  navigateToDrawerItem,
  tapById,
  tapByText,
  maybeTapByText,
  waitForVisibleById,
  scrollUntilVisibleById,
  goBack,
  sleep,
} = require("./helpers/ui");

// Exercises every MapLibre-based screen (v11 migration sanity): the map must
// mount and the screen must stay responsive (no native crash ends the test
// run immediately under Detox).
describe("Maps (MapLibre v11)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  beforeEach(async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
  });

  it("renders the aggregated alerts map (Liste / Carte / Messages tabs)", async () => {
    await tapById("header-right-alerts");
    await tapByText("Carte");
    // Give the surface time to initialize; a native crash would abort here.
    await sleep(4_000);
    await tapByText("Liste");
    await tapByText("Messages");
    await goBack();
  });

  it("renders the defibrillators map", async () => {
    await navigateToDrawerItem("Défibrillateurs");
    await maybeTapByText("Carte");
    await sleep(4_000);
    await goBack();
  });

  it("renders the useful places map", async () => {
    await navigateToDrawerItem("Lieux utiles");
    await maybeTapByText("Carte");
    await sleep(4_000);
    await goBack();
  });

  it("returns to the Send Alert screen without crash", async () => {
    await waitForVisibleById("main-layout");
    await scrollUntilVisibleById("send-alert-cta-red");
  });
});
