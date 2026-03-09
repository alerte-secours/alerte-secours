import * as Sentry from "@sentry/react-native";
import { fromPromise } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

import getStatusCode from "./getStatusCode";
import isAbortError from "./isAbortError";

import { getSessionState } from "~/stores";

let pendingRequests = [];

const resolvePendingRequests = () => {
  pendingRequests.map((callback) => callback());
  pendingRequests = [];
};

import network from "./index";

export default function createErrorLink({ store }) {
  const { authActions, getAuthState } = store;
  const errorLogger = createLogger({
    module: NETWORK_SCOPES.APOLLO,
    service: "error-handler",
  });

  // Helper to extract error message from all possible locations
  const getErrorMessage = (error) =>
    error.message ||
    error.networkError?.message ||
    error.graphQLErrors?.[0]?.message ||
    "no message available";

  // Helper to handle WebSocket and network errors
  const handleWebSocketError = (error) => {
    const errorMsg = getErrorMessage(error);

    if (errorMsg?.includes("Expected HTTP 101")) {
      errorLogger.warn("WebSocket upgrade failed", {
        reason: "HTTP 101 expected",
        error: errorMsg,
      });
      return true;
    }

    if (errorMsg?.includes("client is null")) {
      errorLogger.warn("WebSocket client not initialized", {
        error: errorMsg,
        action: "attempting restart",
      });
      // Attempt to restart the WebSocket connection using the network singleton
      network.apolloClient?.restartWS();
      errorLogger.info("WebSocket connection restart initiated");
      return true;
    }

    if (errorMsg?.includes("Network request failed")) {
      errorLogger.warn("Network request failed", {
        reason: "connection may be offline",
        error: errorMsg,
      });
      return true;
    }

    return false;
  };

  const errorLink = onError((error) => {
    const { operation, forward } = error;
    const statusCode = getStatusCode(error);

    if (
      operation.operationName === "registerUser" ||
      operation.operationName === "loginUserToken"
    ) {
      switch (statusCode) {
        case 410:
          authActions.logout();
          break;
        default:
          // Handle WebSocket errors first
          if (handleWebSocketError(error)) {
            return;
          }
          errorLogger.error("Apollo operation error", {
            operation: operation.operationName,
            error: error.graphQLErrors?.[0]?.message || error,
          });
          break;
      }
      return;
    }

    switch (statusCode) {
      case 401:
        let forward$;
        if (!getAuthState().loading) {
          forward$ = fromPromise(
            authActions
              .reload()
              .then((ok) => {
                resolvePendingRequests();
                return ok;
              })
              .catch((_error) => {
                errorLogger.error("Auth refresh failed", { error: _error });
                return;
              }),
          ).filter((value) => Boolean(value));
        } else {
          forward$ = fromPromise(
            new Promise((resolve) => {
              pendingRequests.push(() => resolve());
            }),
          );
        }
        return forward$.flatMap(() => forward(operation));
      default:
        if (isAbortError(error)) {
          // ignore abort error
          return;
        }

        // Handle WebSocket errors first
        if (handleWebSocketError(error)) {
          return;
        }

        // Capture all other errors in Sentry
        const errorMessage = `apollo error: ${getErrorMessage(error)}`;

        const authState = getAuthState();
        const sessionState = getSessionState() || {};

        // Keep Sentry context useful but avoid high-volume/PII payloads.
        // - Don't attach the raw Apollo error object (can contain request details)
        // - Don't attach identifiers (userId/deviceId)
        // - Keep role info since it's relevant to the incident class
        const safeExtras = {
          operationName: operation.operationName,
          statusCode,
          reloadId: authState?.reloadId,
          hasUserToken: !!authState?.userToken,
          authLoading: !!authState?.loading,
          session: {
            initialized: !!sessionState.initialized,
            defaultRole: sessionState.defaultRole,
            allowedRolesCount: Array.isArray(sessionState.allowedRoles)
              ? sessionState.allowedRoles.length
              : 0,
          },
        };

        Sentry.captureException(new Error(errorMessage), {
          extra: safeExtras,
        });
    }
  });

  return errorLink;
}
