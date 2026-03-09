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

export default function useStreamQueryWithSubscription(
  initialQuery,
  subscription,
  {
    cursorVar = "cursor",
    cursorKey = "id",
    uniqKey = "id",
    variables: paramVariables = {},
    initialCursor = -1,
    skip = false,
    subscriptionKey = "default",
    context = DEFAULT_CONTEXT,
    shouldIncludeItem = DEFAULT_SHOULD_INCLUDE_ITEM,
    maxRetries = MAX_RETRIES, // Allow overriding default max retries
    livenessStaleMs = null,
    livenessCheckEveryMs = 15_000,
    refetchOnReconnect = false,
    refetchOnStale = false,
    refetchOnStaleCooldownMs = 60_000,
    ...queryParams
  } = {},
) {
  const variables = useShallowMemo(() => paramVariables, paramVariables);

  const {
    wsClosedDate,
    wsConnected,
    wsLastHeartbeatDate,
    wsLastRecoveryDate,
    hasInternetConnection,
  } = useNetworkState([
    "wsClosedDate",
    "wsConnected",
    "wsLastHeartbeatDate",
    "wsLastRecoveryDate",
    "hasInternetConnection",
  ]);

  // State to force re-render and retry subscription
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [reconnectSyncTrigger, setReconnectSyncTrigger] = useState(0);
  // State to force a resubscribe when returning to foreground (mobile lock/unlock).
  const [foregroundKick, setForegroundKick] = useState(0);

  const variableHashRef = useRef(JSON.stringify(variables));
  const lastCursorRef = useRef(initialCursor);
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

  // Per-subscription liveness watchdog: if WS is connected but this subscription
  // hasn't delivered any payload for some time, trigger a resubscribe.
  const lastSubscriptionDataAtRef = useRef(Date.now());
  const lastLivenessKickAtRef = useRef(0);
  const lastStaleRefetchAtRef = useRef(0);
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
      if (!hasInternetConnection) return;
      if (!wsConnected) return;
      const age = Date.now() - lastSubscriptionDataAtRef.current;
      if (age < livenessStaleMs) return;

      const now = Date.now();

      // Catch-up refetch: if enabled, first try an HTTP refetch (base query)
      // to fill potential gaps, then proceed with resubscribe logic.
      if (
        refetchOnStale &&
        refetch &&
        now - lastStaleRefetchAtRef.current >= refetchOnStaleCooldownMs
      ) {
        lastStaleRefetchAtRef.current = now;
        try {
          Sentry.addBreadcrumb({
            category: "graphql-subscription",
            level: "warning",
            message: "refetch-on-stale start",
            data: {
              subscriptionKey,
              ageMs: age,
              livenessStaleMs,
            },
          });
        } catch (_e) {
          // ignore
        }

        Promise.resolve()
          .then(() => refetch())
          .catch((e) => {
            try {
              Sentry.captureException(e, {
                tags: { subscriptionKey, context: "refetch-on-stale" },
                extra: { ageMs: age, livenessStaleMs },
              });
            } catch (_e2) {
              // ignore
            }
          });
      }
      // Avoid spamming resubscribe triggers.
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
    refetchOnStale,
    refetchOnStaleCooldownMs,
    refetch,
    skip,
    subscriptionKey,
    wsConnected,
    hasInternetConnection,
  ]);

  useEffect(() => {
    const currentVarsHash = JSON.stringify(variables);
    if (currentVarsHash !== variableHashRef.current) {
      console.log(
        `[${subscriptionKey}] Variables changed, resetting cursor to initial value:`,
        initialCursor,
      );
      lastCursorRef.current = initialCursor;
      variableHashRef.current = currentVarsHash;
      initialSetupDoneRef.current = false;
      wasLoadingRef.current = true;
    }
  }, [variables, initialCursor, cursorVar, subscriptionKey]);

  const queryVariables = useMemo(
    () => ({
      ...variables,
      [cursorVar]: initialCursor,
    }),
    [variables, cursorVar, initialCursor],
  );

  const {
    data: queryData,
    loading,
    error,
    subscribeToMore,
    refetch,
  } = useQuery(initialQuery, {
    ...queryParams,
    variables: queryVariables,
    fetchPolicy: queryParams.fetchPolicy || "cache-and-network",
    skip,
    context: {
      ...context,
      subscriptionKey,
    },
    onCompleted: (data) => {
      // (Optional) Place for further logic if needed
      // console.log(`[${subscriptionKey}] initial query onCompleted`, data);
    },
  });

  // Update last cursor from the main query results
  useEffect(() => {
    if (!queryData) return;

    const queryRootKey = Object.keys(queryData)[0];
    if (!queryRootKey) return;

    const items = queryData[queryRootKey] || [];
    // We only consider non-optimistic items
    const nonOptimisticItems = items.filter((item) => !item.isOptimistic);

    if (nonOptimisticItems.length > 0) {
      const lastItem = nonOptimisticItems[nonOptimisticItems.length - 1];
      const newCursor = lastItem[cursorKey];

      lastCursorRef.current = newCursor;
      console.log(
        `[${subscriptionKey}] Updated subscription cursor:`,
        newCursor,
      );
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

    // If we're about to (re)subscribe, always cleanup any previous subscription first.
    // This is critical because React effect cleanups must be returned synchronously
    // from the effect, not from inside async callbacks.
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (_e) {
        // ignore
      }
      unsubscribeRef.current = null;
    }

    // Check if max retries reached and we have an error - this check must be done regardless of other conditions
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
            context: "useStreamQueryWithSubscription",
          },
          extra: {
            variablesHash: variableHashRef.current,
            lastCursor: lastCursorRef.current,
          },
        });
      } catch (sentryError) {
        console.error("Failed to report to Sentry:", sentryError);
      }

      return;
    }

    // Wait for:
    //  - either initial setup not done yet
    //  - or a new wsClosedDate (WS reconnect)
    //  - or a retry trigger
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
      `[${subscriptionKey}] Setting up subscription${retryMessage} with cursor:`,
      lastCursorRef.current,
    );

    // Use timeout for backoff
    timeoutIdRef.current = setTimeout(() => {
      initialSetupDoneRef.current = true;

      try {
        const unsubscribe = subscribeToMore({
          document: subscription,
          variables: {
            ...variables,
            [cursorVar]: lastCursorRef.current,
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

            // Fast path: when uniqKey === cursorKey, cursor ordering is ASC, and incoming items
            // are strictly newer than the last existing item, we can append without rebuilding
            // a full map + sort (avoids O(N log N) work on large lists).
            if (uniqKey === cursorKey && existingItems.length > 0) {
              const lastExistingCursor =
                existingItems[existingItems.length - 1]?.[cursorKey];

              // Filter items first (and update cursor), while verifying monotonicity.
              let monotonic = true;
              const filteredNewItems = [];

              for (const item of newItems) {
                if (!shouldIncludeItemRef.current(item, contextRef.current)) {
                  continue;
                }

                const itemCursor = item[cursorKey];
                if (itemCursor == null) continue;

                if (
                  typeof lastExistingCursor === "number" &&
                  typeof itemCursor === "number" &&
                  itemCursor <= lastExistingCursor
                ) {
                  monotonic = false;
                  break;
                }

                // Update last cursor if item is newer
                if (
                  !lastCursorRef.current ||
                  itemCursor > lastCursorRef.current
                ) {
                  lastCursorRef.current = itemCursor;
                }

                filteredNewItems.push(item);
              }

              if (monotonic) {
                if (filteredNewItems.length === 0) {
                  const tookMs = Date.now() - mergeStart;
                  if (tookMs > 100) {
                    console.warn(
                      `[${subscriptionKey}] updateQuery merge took ${tookMs}ms (fast-path, existing=${existingItems.length}, new=${newItems.length}, result=${existingItems.length})`,
                    );
                  }
                  return prev;
                }

                const resultItems = [...existingItems, ...filteredNewItems];

                const tookMs = Date.now() - mergeStart;
                if (tookMs > 100) {
                  console.warn(
                    `[${subscriptionKey}] updateQuery merge took ${tookMs}ms (fast-path, existing=${existingItems.length}, new=${newItems.length}, result=${resultItems.length})`,
                  );
                }

                return {
                  ...prev,
                  [queryRootKey]: resultItems,
                };
              }
            }

            // 1) Build a map from existing items
            const itemMap = new Map();
            existingItems.forEach((item) => {
              // If the user's filter says "include," we add it
              if (shouldIncludeItemRef.current(item, contextRef.current)) {
                itemMap.set(item[uniqKey], item);
              }
            });

            // 2) Merge new items
            newItems.forEach((item) => {
              if (!shouldIncludeItemRef.current(item, contextRef.current)) {
                return;
              }

              // Update last cursor if item is newer
              const newItemCursor = item[cursorKey];
              if (
                !lastCursorRef.current ||
                newItemCursor > lastCursorRef.current
              ) {
                lastCursorRef.current = newItemCursor;
                console.log(
                  `[${subscriptionKey}] New message received with cursor:`,
                  lastCursorRef.current,
                );
              }

              const existing = itemMap.get(item[uniqKey]);
              // If there's no item yet, or the existing was optimistic while this is not, replace
              if (!existing || (existing.isOptimistic && !item.isOptimistic)) {
                itemMap.set(item[uniqKey], item);
              }
            });

            // 3) Sort by cursorKey
            const sortedItems = Array.from(itemMap.values()).sort((a, b) => {
              const aCursor = a[cursorKey];
              const bCursor = b[cursorKey];
              return aCursor - bCursor;
            });

            const tookMs = Date.now() - mergeStart;
            if (tookMs > 100) {
              console.warn(
                `[${subscriptionKey}] updateQuery merge took ${tookMs}ms (existing=${existingItems.length}, new=${newItems.length}, result=${sortedItems.length})`,
              );
            }

            return {
              [queryRootKey]: sortedItems,
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
                context: "useStreamQueryWithSubscription-setup",
              },
              extra: {
                variablesHash: variableHashRef.current,
                lastCursor: lastCursorRef.current,
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
    refetch,
  };
}
