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
  goBack,
  sleep,
} = require("./helpers/ui");
const backend = require("./helpers/backendClient");

// SMS-reception flow: an alert's share link (the one sent by SMS) carries
// `/code/<code>?q=c:<accessCode>~l:<lat>,<lon>`. Opening it must connect the
// app to that alert (CONNECT_ALERT + LOAD_ALERT_BY_CODE) and land on the
// AlertCur screen with chat rights. The sender is an API-simulated user on
// the local backend, so the link is forged from real code/accessCode values.
const describeLocal =
  process.env.E2E_LOCAL_BACKEND === "1" ? describe : describe.skip;

const [LON, LAT] = (process.env.E2E_GEO_FIX || "8.5417 47.3769")
  .split(" ")
  .map(Number);

describeLocal("Deep link to another user's alert (SMS link flow)", () => {
  let user2;
  let alert2;

  beforeAll(async () => {
    user2 = await backend.registerUser("e2e-deeplink-sender");
    await backend.geolocSync(user2.bearerJwt, { latitude: LAT, longitude: LON });
    // notifyAround stays false: the app must reach this alert through the
    // link only, not through proximity matching.
    alert2 = await backend.sendAlert(user2.bearerJwt, {
      latitude: LAT,
      longitude: LON,
      subject: "e2e deep link alert",
    });
    await launchApp();
    await completeOnboardingIfPresent();
  });

  afterAll(async () => {
    await backend.closeAlert(user2.bearerJwt, alert2.alertId);
  });

  it("opening the share link lands on the sender's alert", async () => {
    const url =
      `https://app.alertesecours.fr/code/${encodeURIComponent(alert2.code)}` +
      `?q=c:${alert2.accessCode}~l:${LAT},${LON}`;
    await device.launchApp({ newInstance: false, url });
    // AlertCur screen of a received alert: tab bar is there, but no owner
    // close button.
    await waitForVisibleByText("Messages", 30_000);
  });

  it("the app user can chat on the received alert", async () => {
    await tapByText("Messages");
    await waitForVisibleById("chat-input-text");
    const message = `e2e deeplink reply ${device.id}`;
    await sendChatMessage(message);
    await waitForVisibleByText(message, 60_000);

    // The sender must see it through the API (proves the connect really
    // registered the app user on the alert, not just a local echo).
    const deadline = Date.now() + 60_000;
    for (;;) {
      const messages = await backend.getMessages(
        user2.bearerJwt,
        alert2.alertId,
      );
      if (messages.some((m) => m.text === message)) break;
      if (Date.now() > deadline) {
        throw new Error(
          `sender never saw "${message}"; got: ${JSON.stringify(messages)}`,
        );
      }
      await sleep(2_000);
    }
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
