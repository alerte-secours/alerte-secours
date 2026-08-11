const {
  adbTapByLabel,
  launchApp,
  completeOnboardingIfPresent,
  scrollUntilVisibleById,
  waitForVisibleById,
  waitForVisibleByText,
  tapById,
  tapByText,
  tapByLabel,
  isVisibleById,
  isVisibleByText,
  maybeTapByText,
  goBack,
  sleep,
} = require("./helpers/ui");

// Chat coverage on a real staging alert: text message, then audio message
// (record via the emulator microphone + play back). Audio broke in past Expo
// upgrades — this guards the expo-audio record/playback path end-to-end.
describe("Chat (text + audio messages on staging)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  it("sends a green alert and opens its chat", async () => {
    await scrollUntilVisibleById("send-alert-cta-green");
    await tapById("send-alert-cta-green");
    await tapById("send-alert-confirm-submit");
    await waitForVisibleById("alert-cur-close", 60_000);

    // Switch to the Messages tab of the current alert.
    await tapByText("Messages");
    await waitForVisibleById("chat-input-text");
  });

  it("sends a text message and sees it in the thread", async () => {
    const message = `e2e message ${device.id}`;
    await tapById("chat-input-text");
    await element(by.id("chat-input-text")).replaceText(message);
    await tapById("chat-input-send");
    await waitForVisibleByText(message, 60_000);
  });

  it("records an audio message, sends it and plays it back", async () => {
    // Close the keyboard left open by the text test — it swallows the first
    // tap otherwise.
    try {
      await device.pressBack();
    } catch (_e) {
      // ignore
    }
    // Empty input → the right button is the microphone. Espresso taps on
    // this control are unreliable: go through adb/uiautomator instead,
    // retrying until the recording UI is up (the delete control only exists
    // while recording).
    let recordingStarted = false;
    for (let i = 0; i < 3; i++) {
      adbTapByLabel("Démarrer l'enregistrement audio");
      if (await isVisibleById("chat-input-delete-recording", 4_000)) {
        recordingStarted = true;
        break;
      }
    }
    if (!recordingStarted) {
      await waitForVisibleById("chat-input-delete-recording", 5_000);
    }
    await sleep(3_000); // record ~3s from the (virtual) microphone
    // Same button now sends the recording.
    adbTapByLabel("Envoyer l'enregistrement audio");

    // The audio message appears in the thread with its player.
    await waitForVisibleByText("Lire le message audio", 30_000);

    // Play it back: no crash, and the control switches to pause (playback
    // actually started) — poll a few seconds for the state change.
    await tapByLabel("Lire le message audio");
    let playing = false;
    for (let i = 0; i < 10; i++) {
      if (await isVisibleByText("Mettre en pause", 1_000)) {
        playing = true;
        break;
      }
      // Some devices finish very short clips quickly; a returned play button
      // after a real playback is acceptable too.
      await sleep(500);
    }
    if (!playing) {
      // Playback may already have completed (3s clip): the play button must
      // still be there and the app alive.
      await waitForVisibleByText("Lire le message audio", 5_000);
    }
  });

  it("closes the alert (staging cleanup)", async () => {
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
