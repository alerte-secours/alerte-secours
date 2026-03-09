import { ApolloLink } from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";

import getStatusCode from "./getStatusCode";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

const retryLogger = createLogger({
  module: NETWORK_SCOPES.APOLLO,
  feature: "retry-link",
});

export default function createRetryLink({
  getRetryMaxAttempts,
  maxAttempts: defaultMaxAttempts = Infinity,
}) {
  const errorRetryLink = new ApolloLink((operation, forward) => {
    return forward(operation).map((data) => {
      if (data && data.errors && data.errors.length > 0) {
        throw { graphQLErrors: data.errors };
      }
      return data;
    });
  });

  const retryLink = new RetryLink({
    delay: {
      initial: 2000, // 2 seconds
      // max: 5000, // 5 seconds for debug
      max: 180000, // 3 minutes
      jitter: true,
    },
    attempts: (count, operation, error) => {
      if (count > 1) {
        retryLogger.debug("Apollo retry attempt", {
          count,
          error: JSON.stringify(error),
        });
      }
      if (!error) {
        return false;
      }

      const maxAttempts = getRetryMaxAttempts
        ? getRetryMaxAttempts(operation)
        : defaultMaxAttempts;

      if (count > maxAttempts) {
        return false;
      }

      if (error && error.name === "AbortError") {
        return error.reason === "timeout";
      }

      if (error.toString() === "TypeError: Network request failed") {
        error = { networkError: error };
      }
      const statusCode = getStatusCode(error);

      if (statusCode === 0 || statusCode >= 500 || error.networkError) {
        return true;
      }

      if (statusCode >= 400 && statusCode < 500) {
        return false;
      }
      if (statusCode === undefined) {
        return false;
      }
    },
  });

  return retryLink.concat(errorRetryLink);
}
