import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Sentry from "@sentry/react-native";
import { useNetworkState, networkActions } from "~/stores";
import network from "~/network";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

const watchdogLogger = createLogger({
  module: NETWORK_SCOPES.WEBSOCKET,
  feature: "watchdog",
});

const HEARTBEAT_STALE_MS = 45_000;
const CHECK_EVERY_MS = 10_000;
const MIN_RESTART_INTERVAL_MS = 30_000;
const CONNECT_STALE_MS = 20_000;

export default function useWsWatchdog({ enabled = true } = {}) {
  const {
    wsConnected,
    wsLastHeartbeatDate,
    wsLastRecoveryDate,
    hasInternetConnection,
  } = useNetworkState([
    "wsConnected",
    "wsLastHeartbeatDate",
    "wsLastRecoveryDate",
    "hasInternetConnection",
  ]);

  const lastRestartRef = useRef(0);
  const wsLastHeartbeatDateRef = useRef(wsLastHeartbeatDate);
  const appStateRef = useRef(AppState.currentState);
  const wsLastRecoveryDateRef = useRef(wsLastRecoveryDate);
  const connectBeganAtRef = useRef(null);

  useEffect(() => {
    wsLastHeartbeatDateRef.current = wsLastHeartbeatDate;
  }, [wsLastHeartbeatDate]);

  useEffect(() => {
    wsLastRecoveryDateRef.current = wsLastRecoveryDate;
  }, [wsLastRecoveryDate]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
      if (next === "active") {
        // Avoid false positives right after app foreground (timers may have been throttled).
        lastRestartRef.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (appStateRef.current !== "active") return;
      if (!hasInternetConnection) return;

      // If the app has internet but WS is not connected for too long,
      // proactively restart the WS transport.
      if (!wsConnected) {
        if (!connectBeganAtRef.current) {
          connectBeganAtRef.current = Date.now();
        }

        const age = Date.now() - connectBeganAtRef.current;
        if (age < CONNECT_STALE_MS) return;

        const now = Date.now();
        if (now - lastRestartRef.current < MIN_RESTART_INTERVAL_MS) return;

        // Global recovery throttle: avoid double restarts from multiple sources.
        const lastRecovery = wsLastRecoveryDateRef.current
          ? Date.parse(wsLastRecoveryDateRef.current)
          : NaN;
        if (Number.isFinite(lastRecovery)) {
          const recoveryAge = now - lastRecovery;
          if (recoveryAge < MIN_RESTART_INTERVAL_MS) return;
        }

        lastRestartRef.current = now;
        networkActions.WSRecoveryTouch();

        watchdogLogger.warn(
          "WS not connected while internet is up, restarting",
          {
            ageMs: age,
          },
        );

        try {
          Sentry.addBreadcrumb({
            category: "websocket",
            level: "warning",
            message: "ws watchdog not connected",
            data: { ageMs: age },
          });
        } catch (_e) {
          // ignore
        }

        try {
          network.apolloClient?.restartWS?.();
        } catch (error) {
          watchdogLogger.error("WS restart failed", { error });
          try {
            Sentry.captureException(error, {
              tags: { context: "ws-watchdog-restart-failed" },
            });
          } catch (_e) {
            // ignore
          }
        }

        return;
      }

      // Reset connect timer once connected.
      connectBeganAtRef.current = null;
      if (!wsLastHeartbeatDateRef.current) return;

      const last = Date.parse(wsLastHeartbeatDateRef.current);
      if (!Number.isFinite(last)) return;

      const age = Date.now() - last;
      if (age < HEARTBEAT_STALE_MS) return;

      const now = Date.now();
      if (now - lastRestartRef.current < MIN_RESTART_INTERVAL_MS) return;

      // Global recovery throttle: avoid double restarts from multiple sources.
      const lastRecovery = wsLastRecoveryDateRef.current
        ? Date.parse(wsLastRecoveryDateRef.current)
        : NaN;
      if (Number.isFinite(lastRecovery)) {
        const recoveryAge = now - lastRecovery;
        if (recoveryAge < MIN_RESTART_INTERVAL_MS) return;
      }

      lastRestartRef.current = now;
      networkActions.WSRecoveryTouch();

      watchdogLogger.warn("WS heartbeat stale, triggering recovery", {
        ageMs: age,
        lastHeartbeatDate: wsLastHeartbeatDateRef.current,
      });

      try {
        Sentry.addBreadcrumb({
          category: "websocket",
          level: "warning",
          message: "ws watchdog heartbeat stale",
          data: {
            ageMs: age,
            lastHeartbeatDate: wsLastHeartbeatDateRef.current,
          },
        });
      } catch (_e) {
        // ignore
      }

      try {
        // First line recovery: restart websocket transport
        try {
          Sentry.captureMessage("ws watchdog restarting transport", {
            level: "warning",
            extra: {
              ageMs: age,
              lastHeartbeatDate: wsLastHeartbeatDateRef.current,
            },
          });
        } catch (_e) {
          // ignore
        }
        network.apolloClient?.restartWS?.();
      } catch (error) {
        watchdogLogger.error("WS restart failed", { error });

        try {
          Sentry.captureException(error, {
            tags: { context: "ws-watchdog-restart-failed" },
          });
        } catch (_e) {
          // ignore
        }
      }

      // Second line recovery: if WS stays stale, do a full client reload
      setTimeout(() => {
        const last2 = Date.parse(wsLastHeartbeatDateRef.current);
        const age2 = Number.isFinite(last2) ? Date.now() - last2 : Infinity;
        if (age2 >= HEARTBEAT_STALE_MS) {
          watchdogLogger.warn(
            "WS still stale after restart, triggering reload",
            {
              ageMs: age2,
            },
          );

          try {
            Sentry.captureMessage("ws watchdog triggering reload", {
              level: "warning",
              extra: { ageMs: age2 },
            });
          } catch (_e) {
            // ignore
          }

          networkActions.triggerReload();
        }
      }, 10_000);
    }, CHECK_EVERY_MS);

    return () => clearInterval(interval);
  }, [enabled, hasInternetConnection, wsConnected]);
}
