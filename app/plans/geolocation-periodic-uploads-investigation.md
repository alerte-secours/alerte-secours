# Geolocation periodic uploads investigation

## Observations

From the app logs, we still see background IDLE uploads every ~5–10 minutes even when the device is stationary.

Key points:

- The upload is happening with `sample: undefined` (ie, persisted location) and is followed by HTTP success.
- Motion state can flip to `isMovingState: true` even while `activity: still` and low `speed`.
- In at least one diagnostic snapshot, `stopOnStationary` appeared as `undefined`, suggesting the config either:
  - is not being applied as expected, or
  - is being overridden by another config surface, or
  - is not exposed in `getState()` on that platform/version.

## Next steps

1. Confirm the currently running app build includes the latest config (`useSignificantChangesOnly`, `activity.stopOnStationary`).
2. Extract precise server-side event timing distribution from Explore logs to see whether bursts correlate to motionchange or other triggers.
3. If periodic uploads persist after significant-change mode:
   - evaluate whether another mechanism triggers periodic sync (eg native retry/reconnect),
   - consider disabling motion-activity updates in IDLE or increasing motion trigger delay,
   - optionally introduce a server-side dedupe (ignore updates if within X meters and within Y minutes) as last-resort safety.

## Notes

The Explore log snippet currently contains only `action` and `timestamp` (no payload coordinates), so it can confirm frequency/bursts but not whether the same point is repeatedly uploaded.
