const {
  launchApp,
  completeOnboardingIfPresent,
  scrollUntilVisibleById,
  waitForVisibleByText,
  isVisibleById,
  navigateToDrawerItem,
  goBack,
} = require("./helpers/ui");
const backend = require("./helpers/backendClient");

// SMS authentication round trip: the app registers a phone number by having
// the user SEND an SMS whose body carries a signed code (AS_R_<...>, HMAC of
// userId.timestamp with the user's auth_sign_key); the SMS provider then
// webhooks the backend. The test forges that inbound webhook with the real
// code — same crypto as the app — so the entire backend path
// (signature check, phone_number registration) and the app's live reaction
// (the Relatives screen unlocks through its subscription) are exercised
// without a phone line.
const describeLocal =
  process.env.E2E_LOCAL_BACKEND === "1" ? describe : describe.skip;

describeLocal("SMS auth (simulated inbound Ringover webhook)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  it("shows the locked relatives feature while no phone is registered", async () => {
    await navigateToDrawerItem("Mes Proches");
    await waitForVisibleByText(
      "Vous devez enregistrer un numéro de téléphone pour pouvoir utiliser cette fonctionnalité.",
      20_000,
    );
  });

  it("registers the phone via the inbound SMS and the screen unlocks live", async () => {
    const appUser = await backend.getAppUserAuth();
    const code = backend.makeAuthSmsCode(appUser.userId, appUser.signKey, "R");
    // Random number: re-running against a kept DB must not collide with a
    // number owned by a previous run's user (that would trigger the
    // account-transfer flow instead of a registration).
    const fromNumber = `+33699${Math.floor(100000 + Math.random() * 899999)}`;
    await backend.postInboundAuthSms({
      fromNumber,
      body: `S'enregistrer sur Alerte-Secours:\nCode: ${code}\n💙`,
    });
    // No reload: the RELATIVES_SUBSCRIPTION must push the new phone number
    // and swap the disabled screen for the relatives management UI.
    // ("Numéro de contact" would be wrong here: it only renders with more
    // than one registered number.)
    await waitForVisibleByText("Personnes à contacter en cas d'urgence", 30_000);
  });

  it("returns to the home screen (cleanup)", async () => {
    for (let i = 0; i < 5; i++) {
      if (await isVisibleById("send-alert-cta-red", 2_000)) {
        return;
      }
      await goBack();
    }
    await launchApp();
    await scrollUntilVisibleById("send-alert-cta-red");
  });
});
