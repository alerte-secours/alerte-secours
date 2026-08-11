const {
  launchApp,
  completeOnboardingIfPresent,
  scrollUntilVisibleById,
  waitForVisibleById,
  waitForVisibleByText,
  sendChatMessage,
  tapById,
  tapByText,
  isVisibleById,
  maybeTapByText,
  sleep,
} = require("./helpers/ui");
const backend = require("./helpers/backendClient");

// Bidirectional alert flow against the LOCAL backend stack: a second user is
// simulated at the API level (same GraphQL operations as the app), so the
// whole chain is exercised for real — proximity geomatching (redis geodata),
// alerting row creation, and chat both ways over websockets — without a
// second emulator.
//
// Requires the docker-compose stack at the repo root and an APK built with
// .env.e2e-local; gated behind E2E_LOCAL_BACKEND=1 because it targets
// localhost, not staging.
const describeLocal =
  process.env.E2E_LOCAL_BACKEND === "1" ? describe : describe.skip;

// Must match the device's E2E_GEO_FIX ("<lon> <lat>", emulator `geo fix`
// argument order) so user2 sits next to user1.
const [LON, LAT] = (process.env.E2E_GEO_FIX || "8.5417 47.3769")
  .split(" ")
  .map(Number);

describeLocal("Bidirectional alert with an API-simulated second user", () => {
  let user2;
  let alerting;

  beforeAll(async () => {
    // user2 must exist and have a synced location BEFORE the alert is sent,
    // so the backend's expanding-radius geomatch finds it.
    user2 = await backend.registerUser("e2e-second-user");
    await backend.geolocSync(user2.bearerJwt, { latitude: LAT, longitude: LON });
    await launchApp();
    await completeOnboardingIfPresent();
  });

  it("user1 sends a green alert and opens its chat", async () => {
    await scrollUntilVisibleById("send-alert-cta-green");
    await tapById("send-alert-cta-green");
    await tapById("send-alert-confirm-submit");
    await waitForVisibleById("alert-cur-close", 60_000);
    await tapByText("Messages");
    await waitForVisibleById("chat-input-text");
  });

  it("backend geomatching notifies user2 (alerting row created)", async () => {
    alerting = await backend.waitForAlerting(user2.bearerJwt, {
      timeoutMs: 90_000,
    });
    if (!alerting.alertId) {
      throw new Error(`alerting row without alertId: ${JSON.stringify(alerting)}`);
    }
  });

  it("user2's reply reaches user1's chat over websocket", async () => {
    await backend.sendMessage(
      user2.bearerJwt,
      alerting.alertId,
      "Réponse du second utilisateur e2e",
    );
    await waitForVisibleByText("Réponse du second utilisateur e2e", 60_000);
  });

  it("user1's message reaches user2 through the API", async () => {
    const message = `e2e reply ${device.id}`;
    await sendChatMessage(message);
    await waitForVisibleByText(message, 60_000);

    const deadline = Date.now() + 60_000;
    for (;;) {
      const messages = await backend.getMessages(
        user2.bearerJwt,
        alerting.alertId,
      );
      if (messages.some((m) => m.text === message)) break;
      if (Date.now() > deadline) {
        throw new Error(
          `user2 never saw "${message}"; got: ${JSON.stringify(messages)}`,
        );
      }
      await sleep(2_000);
    }
  });

  it("closes the alert (cleanup)", async () => {
    await tapByText("Situation");
    await waitForVisibleById("alert-cur-close", 20_000);
    await tapById("alert-cur-close");
    await maybeTapByText("Terminer l'alerte");
    await maybeTapByText("Terminer");
    await maybeTapByText("Oui");
    await maybeTapByText("OK");
    await sleep(2_000);
    const stillOpen = await isVisibleById("alert-cur-close", 2_000);
    if (stillOpen) {
      throw new Error("Alert still open after tapping close");
    }
  });
});
