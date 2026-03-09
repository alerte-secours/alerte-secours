import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import {
  getAuthState,
  getSessionState,
  subscribeAuthState,
  subscribeSessionState,
} from "~/stores";

import { createTrackingController } from "~/location/bggeo/createTrackingController";

let trackLocationStartPromise = null;
let controller = null;

export default function trackLocation() {
  if (trackLocationStartPromise) return trackLocationStartPromise;

  trackLocationStartPromise = (async () => {
    const log = createLogger({
      module: BACKGROUND_SCOPES.GEOLOCATION,
      feature: "tracking",
    });

    controller = createTrackingController();
    await controller.init();

    // Identity switches can update auth.userToken and session.userId in separate steps.
    // In particular, [`authActions.confirmLoginRequest()`](src/stores/auth.js:203) triggers a
    // reload where `userToken` may be set before `session.userId` is populated.
    //
    // To guarantee the initial geopoint after identity change, re-run auth handling when the
    // session userId changes.
    subscribeSessionState(
      (s) => s?.userId,
      () => {
        const { userToken } = getAuthState();
        // Avoid doing anything if controller isn't ready.
        controller?.handleAuthToken(userToken).catch((e) => {
          log.error("handleAuthToken failed (session change)", {
            error: e?.message,
            stack: e?.stack,
            userId: getSessionState()?.userId ?? null,
          });
        });
      },
    );

    // Auth is the gate: pre-auth we do not START BGGeo tracking.
    // (We may still call `.ready()` defensively to clear stale config and force a stop.)
    const { userToken } = getAuthState();
    subscribeAuthState(
      ({ userToken }) => userToken,
      (nextToken) => {
        controller?.handleAuthToken(nextToken).catch((e) => {
          log.error("handleAuthToken failed", {
            error: e?.message,
            stack: e?.stack,
          });
        });
      },
    );

    // Initial auth handling.
    await controller.handleAuthToken(userToken);
  })().catch((e) => {
    // Allow retry if init fails.
    trackLocationStartPromise = null;
    controller = null;
    throw e;
  });

  return trackLocationStartPromise;
}
