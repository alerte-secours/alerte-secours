const {
  launchApp,
  completeOnboardingIfPresent,
  scrollUntilVisibleById,
  waitForVisibleById,
  tapById,
  isVisibleById,
  maybeTapByText,
  goBack,
  sleep,
} = require("./helpers/ui");

describe("Send Alert (full flow on staging)", () => {
  beforeAll(async () => {
    await launchApp();
    await completeOnboardingIfPresent();
  });

  it("opens the confirmation screen from the red CTA and cancels", async () => {
    await scrollUntilVisibleById("send-alert-cta-red");
    await tapById("send-alert-cta-red");

    // Confirmation screen: submit button + back navigation available.
    await waitForVisibleById("send-alert-confirm-submit");
    // Stop the auto-confirm countdown right away: for the red level it would
    // send the alert AND place a real emergency call.
    await maybeTapByText("Annuler");
    await waitForVisibleById("header-left-back");
    await goBack();
    await scrollUntilVisibleById("send-alert-cta-red");
  });

  it("sends a green alert, then closes it", async () => {
    await scrollUntilVisibleById("send-alert-cta-green");
    await tapById("send-alert-cta-green");

    // Confirm sending (staging backend).
    await tapById("send-alert-confirm-submit");

    // The app navigates to the current alert; the close action confirms the
    // alert is open and owned by us.
    await waitForVisibleById("alert-cur-close", 60_000);

    // Close the alert to leave staging clean.
    await tapById("alert-cur-close");
    // Possible confirmation dialogs (defensive: labels may evolve).
    await maybeTapByText("Terminer l'alerte");
    await maybeTapByText("Terminer");
    await maybeTapByText("Oui");
    await maybeTapByText("Confirmer");
    await maybeTapByText("OK");

    // The close action should disappear once the alert is no longer open.
    await sleep(2_000);
    const stillOpen = await isVisibleById("alert-cur-close", 2_000);
    if (stillOpen) {
      throw new Error("Alert still open after tapping close");
    }
  });
});
