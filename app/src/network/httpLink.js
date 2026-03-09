import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { Platform } from "react-native";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

export default function createHttpLink({ GRAPHQL_URL }) {
  const httpLogger = createLogger({
    module: NETWORK_SCOPES.HTTP,
    service: "graphql",
  });
  // Add debug logging for network requests
  const fetchWithLogging = (uri, options) => {
    httpLogger.debug("Network request", {
      uri,
      method: options.method,
    });

    const timeout = 30000; // 30 seconds

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      // Add custom property to identify timeout-caused aborts
      controller.signal.abortReason = "timeout";
      controller.abort();
    }, timeout);

    return fetch(uri, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        clearTimeout(timeoutId);
        httpLogger.debug("Network response", { status: response.status });
        return response;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        // Add abort reason to the error for better handling
        if (error.name === "AbortError") {
          error.reason = controller.signal.abortReason || "client";
        }
        httpLogger.error("Network error", {
          message: error.message,
          stack: error.stack,
          platform: Platform.OS,
          abortReason: error.reason,
        });
        throw error;
      });
  };

  const httpLink = new BatchHttpLink({
    uri: GRAPHQL_URL,
    batchMax: 10,
    batchInterval: 10,
    fetch: fetchWithLogging,
    credentials: "include", // This might help with SSL/TLS handshake
  });

  return httpLink;
}
