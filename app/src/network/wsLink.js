import { setBearerHeader } from "./headers";
import WebSocketLink from "./WebSocketLink";
import { networkActions } from "~/stores";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

export default function createWsLink({ store, GRAPHQL_WS_URL }) {
  const { getAuthState } = store;
  const wsLogger = createLogger({
    module: NETWORK_SCOPES.WEBSOCKET,
    service: "graphql",
  });

  const getTokenFingerprint = (token) => {
    if (!token || typeof token !== "string") return null;
    // Avoid logging full secrets; this is only for comparing changes.
    return token.slice(-8);
  };

  let activeSocket, pingTimeout;
  let lastConnectionHadToken = false;
  let lastConnectionTokenFingerprint = null;
  let lastTokenRestartAt = 0;

  // If we connect before auth is ready, Hasura will treat the whole WS session as unauthenticated
  // (auth is evaluated on `connection_init`). When the user token becomes available later,
  // we must restart the WS transport once so `connectionParams` includes the token.
  const TOKEN_RESTART_MIN_INTERVAL_MS = 10_000;

  const PING_INTERVAL = 10_000;
  const PING_TIMEOUT = 5_000;

  // Let `graphql-ws` manage reconnection.
  // Our own reconnect scheduling was causing overlapping connection attempts
  // and intermittent RN Android `client is null` (send called on already-closed native socket).
  const MAX_RECONNECT_ATTEMPTS = Infinity;

  const wsLink = new WebSocketLink({
    url: GRAPHQL_WS_URL,
    connectionParams: () => {
      const { userToken } = getAuthState();
      const headers = {};

      lastConnectionHadToken = !!userToken;
      lastConnectionTokenFingerprint = getTokenFingerprint(userToken);

      // Important: only attach Authorization when we have a real token.
      // Sending `Authorization: Bearer undefined` breaks WS auth on some backends.
      if (userToken) {
        setBearerHeader(headers, userToken);
      } else {
        wsLogger.warn("WS connectionParams without userToken", {
          url: GRAPHQL_WS_URL,
        });
      }

      // Note: Sec-WebSocket-Protocol is negotiated at the handshake level.
      // Putting it in `connection_init.payload.headers` is ineffective and can
      // confuse server-side auth header parsing.
      return { headers };
    },
    // Do not use lazy sockets: some RN Android builds intermittently hit
    // WebSocketModule send() with null client when the socket is created/
    // torn down rapidly around app-state transitions.
    lazy: false,
    keepAlive: PING_INTERVAL,
    retryAttempts: MAX_RECONNECT_ATTEMPTS,
    retryWait: async (retries = 0) => {
      // `graphql-ws` calls `retryWait(retries)`.
      // Use a jittered exponential backoff, capped.
      const safeRetries = Number.isFinite(retries) ? retries : 0;
      const base = Math.min(1000 * Math.pow(2, safeRetries), 30_000);
      const delay = base * (0.5 + Math.random());
      await new Promise((resolve) => setTimeout(resolve, delay));
    },
    shouldRetry: () => true,
    on: {
      opened: () => {
        wsLogger.info("WebSocket opened", {
          url: GRAPHQL_WS_URL,
        });
      },
      connected: (socket) => {
        wsLogger.info("WebSocket connected");
        activeSocket = socket;
        networkActions.WSConnected();
        networkActions.WSTouch();

        // If we connected without a token, and a token is now available, restart once.
        // This avoids `ApolloError: no subscriptions exist` caused by an unauthenticated WS session.
        const { userToken } = getAuthState();
        if (!lastConnectionHadToken && userToken) {
          const now = Date.now();
          if (now - lastTokenRestartAt >= TOKEN_RESTART_MIN_INTERVAL_MS) {
            lastTokenRestartAt = now;
            networkActions.WSRecoveryTouch();
            wsLogger.warn(
              "WS connected before auth; restarting to apply user token",
              {
                url: GRAPHQL_WS_URL,
              },
            );
            try {
              wsLink.client?.restart?.();
            } catch (error) {
              wsLogger.error(
                "Failed to restart WS after token became available",
                {
                  error,
                },
              );
            }
          }
        }

        // Clear any lingering ping timeouts
        if (pingTimeout) {
          clearTimeout(pingTimeout);
          pingTimeout = null;
        }
      },
      closed: (event) => {
        wsLogger.info("WebSocket closed", {
          code: event.code,
          reason: event.reason || "No reason provided",
          wasClean: event.wasClean,
        });
        networkActions.WSClosed();

        // Clear socket and timeouts
        activeSocket = undefined;
        if (pingTimeout) {
          clearTimeout(pingTimeout);
          pingTimeout = null;
        }
      },
      ping: (received) => {
        // wsLogger.debug("WebSocket ping", { received });
        networkActions.WSTouch();
        if (!received) {
          // Clear any existing ping timeout
          if (pingTimeout) {
            clearTimeout(pingTimeout);
          }

          pingTimeout = setTimeout(() => {
            wsLogger.warn("WebSocket ping timeout");
            if (activeSocket?.readyState === WebSocket.OPEN) {
              wsLogger.error("WebSocket request timeout, closing connection");
              try {
                activeSocket.close(4408, "Request Timeout");
              } catch (error) {
                wsLogger.error("Error closing WebSocket on ping timeout", {
                  error,
                });
              }
            }
            pingTimeout = null;
          }, PING_TIMEOUT);
        }
      },
      pong: (received) => {
        // wsLogger.debug("WebSocket pong", { received });
        networkActions.WSTouch();
        if (received) {
          clearTimeout(pingTimeout); // pong is received, clear connection close timeout
        }
      },
      error: (error) => {
        wsLogger.error("WebSocket error", {
          message: error?.message,
          url: GRAPHQL_WS_URL,
        });
      },
    },
  });

  // Also listen to token changes and restart if we already have an unauthenticated WS session.
  // This catches the common startup sequence:
  // - WS opens/CONNECTS with no token
  // - auth store later obtains userToken
  if (typeof store?.subscribeAuthState === "function") {
    store.subscribeAuthState(
      (s) => s?.userToken,
      (userToken) => {
        if (!userToken) return;
        if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) return;

        const nextFingerprint = getTokenFingerprint(userToken);
        const tokenChanged =
          !!nextFingerprint &&
          nextFingerprint !== lastConnectionTokenFingerprint;

        // If we are connected without a token OR the token changed while the socket is open,
        // restart the transport so the new token is applied at `connection_init`.
        if (lastConnectionHadToken && !tokenChanged) return;

        const now = Date.now();
        if (now - lastTokenRestartAt < TOKEN_RESTART_MIN_INTERVAL_MS) return;

        lastTokenRestartAt = now;
        networkActions.WSRecoveryTouch();
        wsLogger.warn(
          tokenChanged
            ? "Auth token changed; restarting WS to apply new token"
            : "Auth token became available; restarting unauthenticated WS",
          {
            url: GRAPHQL_WS_URL,
            previousTokenFingerprint: lastConnectionTokenFingerprint,
            nextTokenFingerprint: nextFingerprint,
          },
        );
        try {
          wsLink.client?.restart?.();
        } catch (error) {
          wsLogger.error("Failed to restart WS on auth token change", {
            error,
          });
        }
      },
    );
  } else {
    wsLogger.warn("WS link could not subscribe to auth changes", {
      reason: "store.subscribeAuthState is not a function",
    });
  }

  return wsLink;
}
