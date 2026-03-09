import { useRef, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import * as Sentry from "@sentry/react-native";
import { AppState } from "react-native";
import { useNetworkState, networkActions } from "~/stores";
import network from "~/network";
import useShallowMemo from "./useShallowMemo";

// Constants for retry configuration
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000; // 1 second
const MAX_BACKOFF_MS = 30000; // 30 seconds

const DEFAULT_CONTEXT = {};
const DEFAULT_SHOULD_INCLUDE_ITEM = () => true;

/**
 * Hook that queries for items with custom sorting (e.g., acknowledged first, then by newest)
 * while still using ID-based cursor for subscriptions to new items.
 *
 * This pattern handles cases where UI display order differs from subscription cursor order.
 * Items in the UI can be sorted by multiple criteria (primary: acknowledged, secondary: id),
 * but the subscription still uses a consistent, incrementing ID field for the cursor.
 */
export default function useLatestWithSubscription(
  initialQuery,
  subscription,
  {
    cursorVar = "cursor",
    cursorKey = "id",
    uniqKey = "id",
    variables: paramVariables = {},
    skip = false,
    subscriptionKey = "default",
    context = DEFAULT_CONTEXT,
    shouldIncludeItem = DEFAULT_SHOULD_INCLUDE_ITEM,
    maxRetries = MAX_RETRIES,
    livenessStaleMs = null,
    livenessCheckEveryMs = 15_000,
    refetchOnReconnect = false,
    ...queryParams
  } = {},
) {
  const variables = useShallowMemo(() => paramVariables, paramVariables);

  const { wsClosedDate, wsConnected, wsLastHeartbeatDate, wsLastRecoveryDate } =
    useNetworkState([
      "wsClosedDate",
      "wsConnected",
      "wsLastHeartbeatDate",
      "wsLastRecoveryDate",
    ]);

  // State to force re-render and retry subscription
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [reconnectSyncTrigger, setReconnectSyncTrigger] = useState(0);
  // State to force a resubscribe when returning to foreground (mobile lock/unlock).
  const [foregroundKick, setForegroundKick] = useState(0);

  const variableHashRef = useRef(JSON.stringify(variables));
  const highestIdRef = useRef(null);
  const initialSetupDoneRef = useRef(false);
  const wasLoadingRef = useRef(true);
  const retryCountRef = useRef(0);
  const subscriptionErrorRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Avoid resubscribe loops caused by unstable inline params (object/function identity).
  // We deliberately do NOT put these in the subscribe effect dependency array.
  const contextRef = useRef(context);
  const shouldIncludeItemRef = useRef(shouldIncludeItem);
  const subscriptionKeyRef = useRef(subscriptionKey);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);
  useEffect(() => {
    shouldIncludeItemRef.current = shouldIncludeItem;
  }, [shouldIncludeItem]);
  useEffect(() => {
    subscriptionKeyRef.current = subscriptionKey;
  }, [subscriptionKey]);

  // Per-subscription liveness watchdog
  const lastSubscriptionDataAtRef = useRef(Date.now());
  const lastLivenessKickAtRef = useRef(0);
  const consecutiveStaleKicksRef = useRef(0);
  const lastWsRestartAtRef = useRef(0);
  const lastReloadAtRef = useRef(0);
  const wsLastHeartbeatDateRef = useRef(wsLastHeartbeatDate);
  const appStateRef = useRef(AppState.currentState);
  const wsLastRecoveryDateRef = useRef(wsLastRecoveryDate);
  const lastBecameInactiveAtRef = useRef(null);
  const lastForegroundKickAtRef = useRef(0);

  // Optional refetch-on-reconnect support.
  // Goal: if WS was reconnected (wsClosedDate changes), force a base refetch once before resubscribing
  // to reduce chances of cursor gaps.
  const reconnectRefetchPendingRef = useRef(false);
  const lastReconnectRefetchKeyRef = useRef(null);

  useEffect(() => {
    wsLastHeartbeatDateRef.current = wsLastHeartbeatDate;
  }, [wsLastHeartbeatDate]);

  useEffect(() => {
    wsLastRecoveryDateRef.current = wsLastRecoveryDate;
  }, [wsLastRecoveryDate]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const now = Date.now();
      appStateRef.current = next;

      if (next === "background" || next === "inactive") {
        lastBecameInactiveAtRef.current = now;
        return;
      }

      if (next === "active") {
        const becameInactiveAt = lastBecameInactiveAtRef.current;
        const inactiveMs = becameInactiveAt ? now - becameInactiveAt : null;

        // Timers may have been paused/throttled; reset stale timers to avoid false kicks.
        lastSubscriptionDataAtRef.current = now;
        lastLivenessKickAtRef.current = 0;
        consecutiveStaleKicksRef.current = 0;

        // Some devices keep the WS transport "connected" after a lock/unlock, but the
        // per-operation subscription stops delivering. Trigger a controlled resubscribe.
        const FOREGROUND_KICK_MIN_INACTIVE_MS = 30_000;
        const FOREGROUND_KICK_MIN_INTERVAL_MS = 15_000;

        if (
          typeof inactiveMs === "number" &&
          inactiveMs >= FOREGROUND_KICK_MIN_INACTIVE_MS
        ) {
          if (
            now - lastForegroundKickAtRef.current >=
            FOREGROUND_KICK_MIN_INTERVAL_MS
          ) {
            lastForegroundKickAtRef.current = now;
            try {
              Sentry.addBreadcrumb({
                category: "graphql-subscription",
                level: "info",
                message: "foreground resubscribe kick",
                data: {
                  subscriptionKey: subscriptionKeyRef.current,
                  inactiveMs,
                },
              });
            } catch (_e) {
              // ignore
            }
            console.log(
              `[${subscriptionKeyRef.current}] Foreground resubscribe kick (inactiveMs=${inactiveMs})`,
            );
            setForegroundKick((x) => x + 1);
          }
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!refetchOnReconnect) return;
    if (skip) return;
    if (appStateRef.current !== "active") return;
    if (!wsClosedDate) return;
    if (!refetch) return;

    // Only refetch once per wsClosedDate value.
    if (lastReconnectRefetchKeyRef.current === wsClosedDate) return;
    lastReconnectRefetchKeyRef.current = wsClosedDate;
    reconnectRefetchPendingRef.current = true;

    (async () => {
      try {
        try {
          Sentry.addBreadcrumb({
            category: "graphql-subscription",
            level: "info",
            message: "refetch-on-reconnect start",
            data: { subscriptionKey, wsClosedDate },
          });
        } catch (_e) {
          // ignore
        }
        console.log(
          `[${subscriptionKey}] WS reconnect detected, refetching base query to prevent gaps`,
          { wsClosedDate },
        );
        // Don't block re-subscription forever if refetch is slow/stuck.
        const maxWaitMs = 8000;
        await Promise.race([
          Promise.resolve().then(() => refetch()),
          new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
        ]);
      } catch (e) {
        console.warn(
          `[${subscriptionKey}] Refetch-on-reconnect failed (continuing with resubscribe)`,
          e,
        );

        try {
          Sentry.captureException(e, {
            tags: {
              subscriptionKey,
              context: "refetch-on-reconnect",
            },
            extra: { wsClosedDate },
          });
        } catch (_e2) {
          // ignore
        }
      } finally {
        reconnectRefetchPendingRef.current = false;
        setReconnectSyncTrigger((x) => x + 1);
      }
    })();
  }, [refetch, refetchOnReconnect, skip, subscriptionKey, wsClosedDate]);

  useEffect(() => {
    if (!livenessStaleMs) return;
    if (skip) return;

    const STALE_KICKS_BEFORE_WS_RESTART = 2;
    const STALE_KICKS_BEFORE_RELOAD = 4;
    const GLOBAL_RECOVERY_COOLDOWN_MS = 30_000;
    // Separate throttle for escalations; resubscribe kicks are already throttled by livenessStaleMs.
    const MIN_ESCALATION_INTERVAL_MS = 60_000;

    const interval = setInterval(() => {
      if (appStateRef.current !== "active") return;
      if (!wsConnected) return;
      const age = Date.now() - lastSubscriptionDataAtRef.current;
      if (age < livenessStaleMs) return;

      const now = Date.now();
      const becameInactiveAt = lastBecameInactiveAtRef.current;
      const inactiveWindowMs = becameInactiveAt ? now - becameInactiveAt : null;
      if (
        typeof inactiveWindowMs === "number" &&
        inactiveWindowMs < livenessStaleMs + 15_000
      ) {
        return;
      }

      if (now - lastLivenessKickAtRef.current < livenessStaleMs) return;
      lastLivenessKickAtRef.current = now;

      consecutiveStaleKicksRef.current += 1;

      const wsHeartbeatAgeMs = (() => {
        const hb = wsLastHeartbeatDateRef.current;
        if (!hb) return null;
        const last = Date.parse(hb);
        return Number.isFinite(last) ? Date.now() - last : null;
      })();

      console.warn(
        `[${subscriptionKey}] Liveness stale (${age}ms >= ${livenessStaleMs}ms), forcing resubscribe (wsHeartbeatAgeMs=${
          wsHeartbeatAgeMs ?? "n/a"
        }, kicks=${consecutiveStaleKicksRef.current})`,
      );

      try {
        Sentry.addBreadcrumb({
          category: "graphql-subscription",
          level: "warning",
          message: "liveness stale kick",
          data: {
            subscriptionKey,
            ageMs: age,
            livenessStaleMs,
            wsHeartbeatAgeMs,
            kicks: consecutiveStaleKicksRef.current,
          },
        });
      } catch (_e) {
        // ignore
      }

      // Escalation policy for repeated consecutive stale kicks.
      if (
        consecutiveStaleKicksRef.current >= STALE_KICKS_BEFORE_RELOAD + 2 &&
        now - lastReloadAtRef.current >= MIN_ESCALATION_INTERVAL_MS
      ) {
        const lastRecovery = wsLastRecoveryDateRef.current
          ? Date.parse(wsLastRecoveryDateRef.current)
          : NaN;
        if (
          Number.isFinite(lastRecovery) &&
          now - lastRecovery < GLOBAL_RECOVERY_COOLDOWN_MS
        ) {
          return;
        }

        lastReloadAtRef.current = now;
        networkActions.WSRecoveryTouch();
        console.warn(
          `[${subscriptionKey}] Escalation: triggering reload after ${consecutiveStaleKicksRef.current} stale kicks`,
        );

        try {
          Sentry.captureMessage("subscription escalated to reload", {
            level: "warning",
            tags: { subscriptionKey, context: "liveness" },
            extra: {
              consecutiveKicks: consecutiveStaleKicksRef.current,
              wsHeartbeatAgeMs,
              ageMs: age,
              livenessStaleMs,
            },
          });
        } catch (_e) {
          // ignore
        }

        networkActions.triggerReload("transport");
      } else if (
        consecutiveStaleKicksRef.current >= STALE_KICKS_BEFORE_WS_RESTART &&
        now - lastWsRestartAtRef.current >= MIN_ESCALATION_INTERVAL_MS
      ) {
        const lastRecovery = wsLastRecoveryDateRef.current
          ? Date.parse(wsLastRecoveryDateRef.current)
          : NaN;
        if (
          Number.isFinite(lastRecovery) &&
          now - lastRecovery < GLOBAL_RECOVERY_COOLDOWN_MS
        ) {
          return;
        }

        lastWsRestartAtRef.current = now;
        networkActions.WSRecoveryTouch();
        try {
          console.warn(
            `[${subscriptionKey}] Escalation: restarting WS after ${consecutiveStaleKicksRef.current} stale kicks`,
          );

          try {
            Sentry.captureMessage("subscription escalated to ws restart", {
              level: "warning",
              tags: { subscriptionKey, context: "liveness" },
              extra: {
                consecutiveKicks: consecutiveStaleKicksRef.current,
                wsHeartbeatAgeMs,
                ageMs: age,
                livenessStaleMs,
              },
            });
          } catch (_e2) {
            // ignore
          }

          network.apolloClient?.restartWS?.();
        } catch (error) {
          console.warn(
            `[${subscriptionKey}] Escalation: WS restart failed`,
            error,
          );

          try {
            Sentry.captureException(error, {
              tags: {
                subscriptionKey,
                context: "liveness-ws-restart-failed",
              },
            });
          } catch (_e2) {
            // ignore
          }
        }
      }

      lastSubscriptionDataAtRef.current = now;
      setRetryTrigger((prev) => prev + 1);
    }, livenessCheckEveryMs);

    return () => clearInterval(interval);
  }, [
    livenessStaleMs,
    livenessCheckEveryMs,
    skip,
    subscriptionKey,
    wsConnected,
  ]);

  useEffect(() => {
    const currentVarsHash = JSON.stringify(variables);
    if (currentVarsHash !== variableHashRef.current) {
      console.log(
        `[${subscriptionKey}] Variables changed, resetting subscription setup`,
      );
      highestIdRef.current = null;
      variableHashRef.current = currentVarsHash;
      initialSetupDoneRef.current = false;
      wasLoadingRef.current = true;
    }
  }, [variables, subscriptionKey]);

  const {
    data: queryData,
    loading,
    error,
    subscribeToMore,
    refetch,
  } = useQuery(initialQuery, {
    ...queryParams,
    variables,
    fetchPolicy: queryParams.fetchPolicy || "cache-and-network",
    skip,
    context: {
      ...context,
      subscriptionKey,
    },
  });

  // Extract highest ID from the query results (which are in DESC order)
  useEffect(() => {
    if (!queryData) return;

    const queryRootKey = Object.keys(queryData)[0];
    if (!queryRootKey) return;

    const items = queryData[queryRootKey] || [];
    // Filter out optimistic items
    const nonOptimisticItems = items.filter((item) => !item.isOptimistic);

    if (nonOptimisticItems.length > 0) {
      // When sorted by descending order, the first item has the highest ID
      const highestItem = nonOptimisticItems[0];
      const highestId = highestItem[cursorKey];

      if (
        highestId !== undefined &&
        (highestIdRef.current === null || highestId > highestIdRef.current)
      ) {
        highestIdRef.current = highestId;
        console.log(
          `[${subscriptionKey}] Updated subscription cursor to highest ID:`,
          highestId,
        );
      }
    } else {
      // Handle empty results case - initialize with 0 to allow subscription for first item
      if (highestIdRef.current === null) {
        highestIdRef.current = 0;
        console.log(
          `[${subscriptionKey}] No initial items, setting subscription cursor to:`,
          0,
        );
      }
    }
  }, [queryData, cursorKey, subscriptionKey]);

  // Track loading changes
  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      wasLoadingRef.current = false;
    }
  }, [loading]);

  // Reset retry counter when variables change
  useEffect(() => {
    retryCountRef.current = 0;
    subscriptionErrorRef.current = null;
  }, [variables]);

  // Set up the subscription once initial query is done, or on WS reconnect, etc.
  useEffect(() => {
    if (skip) return; // If skipping, do nothing
    if (!subscribeToMore) return;
    if (highestIdRef.current === null) return; // Wait until we have the highest ID

    if (appStateRef.current !== "active") return;

    // If we opted into refetch-on-reconnect and a reconnect refetch is still pending,
    // wait to (re)subscribe until the base query has been refreshed.
    if (
      refetchOnReconnect &&
      wsClosedDate &&
      reconnectRefetchPendingRef.current
    ) {
      return;
    }

    // Always cleanup any previous active subscription before creating a new one.
    // React only runs the cleanup returned directly from the effect.
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (_e) {
        // ignore
      }
      unsubscribeRef.current = null;
    }

    // Check if max retries reached and we have an error
    if (retryCountRef.current >= maxRetries && subscriptionErrorRef.current) {
      console.error(
        `[${subscriptionKey}] Max retries (${maxRetries}) reached. Stopping subscription attempts.`,
        subscriptionErrorRef.current,
      );

      // Report to Sentry when max retries are reached
      try {
        Sentry.captureException(subscriptionErrorRef.current, {
          tags: {
            subscriptionKey,
            maxRetries: String(maxRetries),
            context: "useLatestWithSubscription",
          },
          extra: {
            variablesHash: variableHashRef.current,
            highestId: highestIdRef.current,
          },
        });
      } catch (sentryError) {
        console.error("Failed to report to Sentry:", sentryError);
      }

      return;
    }

    // Wait for:
    // - either initial setup not done yet
    // - or a new wsClosedDate (WS reconnect)
    // - or a retry trigger
    if (
      initialSetupDoneRef.current &&
      !wsClosedDate &&
      retryTrigger === 0 &&
      foregroundKick === 0
    ) {
      return;
    }

    // Also wait until the query stops loading
    if (!initialSetupDoneRef.current && wasLoadingRef.current) return;

    // Clean up any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Calculate backoff delay if this is a retry
    const backoffDelay =
      retryCountRef.current > 0
        ? Math.min(
            INITIAL_BACKOFF_MS * Math.pow(2, retryCountRef.current - 1),
            MAX_BACKOFF_MS,
          )
        : 0;

    const retryMessage =
      retryCountRef.current > 0
        ? ` Retry attempt ${retryCountRef.current}/${maxRetries} after ${backoffDelay}ms delay`
        : "";

    console.log(
      `[${subscriptionKey}] Setting up subscription${retryMessage} with highestId:`,
      highestIdRef.current,
    );

    // Use timeout for backoff
    timeoutIdRef.current = setTimeout(() => {
      initialSetupDoneRef.current = true;

      try {
        const unsubscribe = subscribeToMore({
          document: subscription,
          variables: {
            ...variables,
            [cursorVar]: highestIdRef.current,
          },
          context: {
            ...contextRef.current,
            subscriptionKey,
          },
          onError: (error) => {
            // Store the error
            subscriptionErrorRef.current = error;

            // Increment retry counter but don't exceed maxRetries
            retryCountRef.current = Math.min(
              retryCountRef.current + 1,
              maxRetries,
            );

            console.error(
              `[${subscriptionKey}] Subscription error (attempt ${retryCountRef.current}/${maxRetries}):`,
              error,
            );

            // If we haven't reached max retries, trigger a retry
            if (retryCountRef.current < maxRetries) {
              // Set a delay before retrying
              setTimeout(() => {
                setRetryTrigger((prev) => prev + 1);
              }, 100); // Small delay to prevent immediate re-execution
            }
          },
          updateQuery: (prev, { subscriptionData }) => {
            // Successfully received data, reset retry counter
            if (subscriptionData.data) {
              retryCountRef.current = 0;
              subscriptionErrorRef.current = null;
              lastSubscriptionDataAtRef.current = Date.now();
              consecutiveStaleKicksRef.current = 0;
            }

            if (!subscriptionData.data) return prev;

            const queryRootKey = Object.keys(prev)[0];
            const subscriptionRootKey = Object.keys(subscriptionData.data)[0];
            if (!queryRootKey || !subscriptionRootKey) return prev;

            const newItems = subscriptionData.data[subscriptionRootKey] || [];
            const existingItems = prev[queryRootKey] || [];

            const mergeStart = Date.now();

            // Filter new items
            const filteredNewItems = newItems.filter(
              (item) =>
                shouldIncludeItemRef.current(item, contextRef.current) &&
                !existingItems.some(
                  (existing) => existing[uniqKey] === item[uniqKey],
                ),
            );

            if (filteredNewItems.length === 0) {
              const tookMs = Date.now() - mergeStart;
              if (tookMs > 100) {
                console.warn(
                  `[${subscriptionKey}] updateQuery merge took ${tookMs}ms (existing=${existingItems.length}, new=${newItems.length}, result=${existingItems.length})`,
                );
              }
              return prev;
            }

            // Update highestId if we received any new items
            filteredNewItems.forEach((item) => {
              const itemId = item[cursorKey];
              if (itemId !== undefined && itemId > highestIdRef.current) {
                highestIdRef.current = itemId;
              }
            });

            console.log(
              `[${subscriptionKey}] Received ${filteredNewItems.length} new items, updated highestId:`,
              highestIdRef.current,
            );

            // For latest items pattern, we prepend new items (DESC order in UI)
            const resultItems = [...filteredNewItems, ...existingItems];

            const tookMs = Date.now() - mergeStart;
            if (tookMs > 100) {
              console.warn(
                `[${subscriptionKey}] updateQuery merge took ${tookMs}ms (existing=${existingItems.length}, new=${newItems.length}, result=${resultItems.length})`,
              );
            }

            return {
              ...prev,
              [queryRootKey]: resultItems,
            };
          },
        });

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        // Handle setup errors (like malformed queries)
        console.error(
          `[${subscriptionKey}] Error setting up subscription:`,
          error,
        );
        subscriptionErrorRef.current = error;

        // Increment retry counter but don't exceed maxRetries
        retryCountRef.current = Math.min(retryCountRef.current + 1, maxRetries);

        console.error(
          `[${subscriptionKey}] Subscription setup error (attempt ${retryCountRef.current}/${maxRetries}):`,
          error,
        );

        // If we haven't reached max retries, trigger a retry
        if (retryCountRef.current < maxRetries) {
          setTimeout(() => {
            setRetryTrigger((prev) => prev + 1);
          }, 100);
        } else {
          // Report to Sentry when max retries are reached
          try {
            Sentry.captureException(error, {
              tags: {
                subscriptionKey,
                maxRetries: String(maxRetries),
                context: "useLatestWithSubscription-setup",
              },
              extra: {
                variablesHash: variableHashRef.current,
                highestId: highestIdRef.current,
              },
            });
          } catch (sentryError) {
            console.error("Failed to report to Sentry:", sentryError);
          }
        }
      }
    }, backoffDelay);

    // Cleanup function that will run when component unmounts or effect re-runs
    return () => {
      console.log(`[${subscriptionKey}] Cleaning up subscription`);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (_e) {
          // ignore
        }
        unsubscribeRef.current = null;
      }
    };
  }, [
    skip,
    wsClosedDate,
    subscribeToMore,
    subscription,
    variables,
    cursorVar,
    uniqKey,
    cursorKey,
    subscriptionKey,
    retryTrigger,
    foregroundKick,
    maxRetries,
    livenessStaleMs,
    livenessCheckEveryMs,
    refetchOnReconnect,
    reconnectSyncTrigger,
  ]);

  return {
    data: queryData,
    loading,
    error,
  };
}
