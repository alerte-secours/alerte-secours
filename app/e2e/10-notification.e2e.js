const {
  launchApp,
  completeOnboardingIfPresent,
  scrollUntilVisibleById,
  waitForVisibleById,
  waitForVisibleByText,
  isVisibleById,
  goBack,
  tapNotificationByText,
} = require("./helpers/ui");
const backend = require("./helpers/backendClient");

// Real push-notification tap-flow: an API-simulated nearby user raises an
// alert with notifyAround, the local backend geomatches the app user's device
// and sends an ACTUAL FCM push (services/tasks has the Firebase service
// account; the emulator runs Play services), the test taps the notification
// in the shade and asserts the app opens on the alert.
//
// This covers the full chain the staging suite never could: fcm token
// registration in DB → geomatch → alert-notify task → FCM delivery → notifee
// display → tap action → in-app navigation.
const describeLocal =
  process.env.E2E_LOCAL_BACKEND === "1" ? describe : describe.skip;

const [LON, LAT] = (process.env.E2E_GEO_FIX || "8.5417 47.3769")
  .split(" ")
  .map(Number);

describeLocal("Push notification tap-flow (real FCM, local backend)", () => {
  let user2;
  let alert2;

  beforeAll(async () => {
    // The app must have run once so its FCM token is registered in the local
    // DB before the alert fires.
    await launchApp();
    await completeOnboardingIfPresent();
    await scrollUntilVisibleById("send-alert-cta-green");

    // On a freshly booted emulator, Play services can take minutes to issue
    // the FCM token; without it in DB the push can never be delivered.
    await backend.waitForAppFcmToken(180_000);

    user2 = await backend.registerUser("e2e-push-sender");
    await backend.geolocSync(user2.bearerJwt, { latitude: LAT, longitude: LON });
  }, 300_000);

  afterAll(async () => {
    if (alert2) {
      await backend.closeAlert(user2.bearerJwt, alert2.alertId);
    }
  });

  it("receives the FCM push for a nearby alert and opens it from the shade", async () => {
    await device.sendToHome();

    alert2 = await backend.sendAlert(user2.bearerJwt, {
      latitude: LAT,
      longitude: LON,
      subject: "e2e push alert",
      notifyAround: true,
    });

    // Geomatch + alert-notify + FCM delivery; the tap brings the app to the
    // foreground through the notification's open-alert action.
    await tapNotificationByText("Nouvelle Alerte", 90_000);

    // AlertCur screen of the received alert.
    await waitForVisibleByText("Messages", 30_000);
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
