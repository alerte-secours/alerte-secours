const backend = require("../helpers/backendClient");
const {
  LAT,
  LON,
  launchAppFresh,
  completeOnboardingIfPresent,
  screenshot,
  sleep,
  scrollUntilVisibleById,
  waitForVisibleById,
  isVisibleById,
  tapById,
  waitForVisibleByText,
  isVisibleByText,
  tapByText,
  waitForVisibleByLabel,
  tapByLabel,
  sendChatMessage,
  makeVoiceClip,
  formatClock,
} = require("../helpers/ios");

// iOS simulator: alert sent and received, chat both ways and voice message
// playback, with a second user simulated at the API level (same operations
// as the app).
//
// Meant for the staging backend, with Metro serving the staging bundle:
//   E2E_BACKEND_GRAPHQL_URL  https://hasura-staging.../v1/graphql
//   E2E_BACKEND_API_URL      https://api-staging.../api/v1/oas
//   E2E_BACKEND_FILES_URL    https://files-staging.../api/v1/oas
//   E2E_BACKEND_MINIO_URL    https://minio-staging...
//
// Recording a voice message is not covered: the app refuses to record on
// the iOS simulator (no usable audio input), which one of the tests pins
// down. It has to be checked on a real device.
const describeIos = device.getPlatform() === "ios" ? describe : describe.skip;

// Distinct per run, so a message left over by a previous run never matches.
const RUN = Date.now().toString(36);

describeIos("iOS: alert, chat and voice message with a second user", () => {
  let user2;
  let alerting;
  let clip;
  let user2Alert;

  beforeAll(async () => {
    clip = makeVoiceClip(
      "Ceci est un message vocal de test, envoyé par le second utilisateur " +
        "pour vérifier la lecture audio dans l'application.",
    );
    console.log(`voice clip: ${clip.seconds.toFixed(2)}s, ${clip.bytes} bytes`);

    // user2 must exist and have a synced location BEFORE the alert is sent,
    // so the backend's expanding-radius geomatch finds it.
    user2 = await backend.registerUser("e2e-second-user");
    await backend.geolocSync(user2.bearerJwt, { latitude: LAT, longitude: LON });
    console.log(`user2: userId=${user2.userId} deviceId=${user2.deviceId}`);

    await launchAppFresh();
    await completeOnboardingIfPresent();
    screenshot("01-send-alert");
    // Fresh install: first bundle served by Metro, then the whole wizard.
  }, 480_000);

  it("user1 sends a green alert from the app", async () => {
    await scrollUntilVisibleById("send-alert-cta-green");
    await tapById("send-alert-cta-green");
    await waitForVisibleById("send-alert-confirm-submit", 30_000);
    screenshot("02-confirm-alert");
    await tapById("send-alert-confirm-submit");
    await waitForVisibleById("alert-cur-close", 60_000);
    screenshot("03-alert-sent");
  });

  it("backend geomatching notifies user2 (alerting row created)", async () => {
    alerting = await backend.waitForAlerting(user2.bearerJwt, {
      timeoutMs: 90_000,
    });
    if (!alerting.alertId) {
      throw new Error(`alerting row without alertId: ${JSON.stringify(alerting)}`);
    }
    console.log(`alert: alertId=${alerting.alertId}`);
  });

  it("user1 opens the alert's chat", async () => {
    await tapByText("Messages");
    await waitForVisibleById("chat-input-text");
  });

  it("user2's text message reaches user1's chat", async () => {
    const message = `Réponse du second utilisateur ${RUN}`;
    await backend.sendMessage(user2.bearerJwt, alerting.alertId, message);
    await waitForVisibleByText(message, 60_000);
    screenshot("04-text-received");
  });

  it("user1's text message reaches user2", async () => {
    const message = `Message envoyé depuis iOS ${RUN}`;
    await sendChatMessage(message); // waits for the message to be displayed
    screenshot("05-text-sent");

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

  it("user2's voice message is played to the end by user1", async () => {
    const { audioFileUuid, messageId } = await backend.sendAudioMessage(
      user2.bearerJwt,
      alerting.alertId,
      clip.path,
    );
    console.log(`voice message: messageId=${messageId} file=${audioFileUuid}`);

    // The file is served, complete, from the URL the app plays it from.
    const stored = await backend.fetchAudioFile(audioFileUuid);
    console.log(`stored voice file: ${JSON.stringify(stored)}`);
    if (stored.status !== 200 || stored.bytes !== clip.bytes) {
      throw new Error(
        `stored file differs from the upload (${clip.bytes} bytes): ` +
          JSON.stringify(stored),
      );
    }

    await waitForVisibleByLabel("Lire le message audio", 60_000);

    // The player shows the clip's duration once it has loaded and decoded
    // the file (it stays at 00:00 otherwise).
    const durations = [
      ...new Set([Math.floor(clip.seconds), Math.ceil(clip.seconds)]),
    ].map(formatClock);
    let shown = null;
    const deadline = Date.now() + 30_000;
    while (!shown && Date.now() < deadline) {
      for (const duration of durations) {
        if (await isVisibleByText(duration, 500)) {
          shown = duration;
          break;
        }
      }
    }
    if (!shown) {
      screenshot("06-voice-duration-missing");
      throw new Error(`the player never displayed ${durations.join(" or ")}`);
    }
    console.log(`voice message duration displayed: ${shown}`);
    screenshot("06-voice-received");

    // The label switches on the native player's own "playing" state.
    await tapByLabel("Lire le message audio");
    await waitForVisibleByLabel("Mettre en pause", 10_000);
    screenshot("07-voice-playing");

    // Reaching the end of the clip puts the player back to its idle state:
    // the playback position really advanced over the whole clip.
    await waitForVisibleByLabel(
      "Lire le message audio",
      (clip.seconds + 20) * 1_000,
    );
    screenshot("08-voice-played");
  }, 240_000);

  it("recording is refused on the simulator (to check on a device)", async () => {
    await tapById("chat-input-mic");
    await waitForVisibleByText("Microphone indisponible", 10_000);
    screenshot("09-recording-refused");
    await tapByText("OK");
    await waitFor(element(by.text("Microphone indisponible")))
      .not.toBeVisible()
      .withTimeout(10_000);
  });

  it("user1 closes the alert (cleanup)", async () => {
    await tapByText("Situation");
    await waitForVisibleById("alert-cur-close", 20_000);
    await tapById("alert-cur-close");
    await sleep(3_000);
    screenshot("10-alert-closed");
    if (await isVisibleById("alert-cur-close", 2_000)) {
      throw new Error("Alert still open after tapping close");
    }
  });

  it("user2's alert reaches user1, who opens it from the list", async () => {
    const subject = `Test e2e iOS ${RUN}`;
    user2Alert = await backend.sendAlert(user2.bearerJwt, {
      latitude: LAT,
      longitude: LON,
      level: "green",
      subject,
      notifyAround: true,
    });
    console.log(
      `user2's alert: alertId=${user2Alert.alertId} code=${user2Alert.code}`,
    );

    await tapByLabel("Alertes "); // top tab: its label ends with a space
    await waitForVisibleByLabel(`#${user2Alert.code}`, 120_000);
    screenshot("11-alert-received");
    await tapByLabel(`#${user2Alert.code}`);
    await waitForVisibleByText(subject, 30_000);
    screenshot("12-alert-received-details");
  }, 200_000);

  afterAll(async () => {
    // user1's own alert can only be closed from the app (test above).
    if (user2Alert) {
      try {
        await backend.closeAlert(user2.bearerJwt, user2Alert.alertId);
      } catch (e) {
        console.warn(`could not close user2's alert: ${e.message}`);
      }
    }
  });
});
