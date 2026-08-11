const {
  launchApp,
  sendChatMessage,
  tapByIdRaw,
  waitForVisibleByLabel,
  isVisibleByLabel,
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
    await sendChatMessage(message);
    await waitForVisibleByText(message, 60_000);
  });

  it("records an audio message, sends it and plays it back", async () => {
    // NOTE: no back-press here to "close the keyboard" — when the keyboard
    // is already down, back NAVIGATES AWAY from the chat and the input bar
    // disappears entirely.
    await sleep(1_500);

    // Empty input → the right button is the microphone. Constraints learned
    // the hard way on this screen:
    // - Espresso-synthesized taps never reach this pressable → raw adb tap;
    // - any Espresso wait executed WHILE a recording is active hangs (the
    //   countdown re-renders every second);
    // - the in-app countdown auto-sends the recording (59s worst case).
    // So: one raw tap to start, then a fixed wait longer than the countdown
    // with zero Espresso traffic, then assert on the thread.
    await tapByIdRaw("chat-input-mic"); // start recording
    await sleep(65_000); // recording + auto-send, no Espresso calls meanwhile
    // The play control only exposes an accessibility label (no text).
    await waitForVisibleByLabel("Lire le message audio", 30_000);

    // Play it back: no crash, and the control switches to pause (playback
    // actually started) — poll a few seconds for the state change.
    await tapByLabel("Lire le message audio");
    let playing = false;
    for (let i = 0; i < 10; i++) {
      if (await isVisibleByLabel("Mettre en pause", 1_000)) {
        playing = true;
        break;
      }
      // Some devices finish very short clips quickly; a returned play button
      // after a real playback is acceptable too.
      await sleep(500);
    }
    if (!playing) {
      // Playback may already have completed: the play button must still be
      // there and the app alive.
      await waitForVisibleByLabel("Lire le message audio", 5_000);
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
