import { ApolloLink } from "@apollo/client";

import { setBearerHeader } from "./headers";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

const authLinkLogger = createLogger({
  module: NETWORK_SCOPES.APOLLO,
  feature: "auth-link",
});

export default function createAuthLink({ store }) {
  const { getAuthState } = store;

  const authLink = new ApolloLink((operation, forward) => {
    const context = operation.getContext();
    const headers = context.hasOwnProperty("headers") ? context.headers : {};

    // Skip adding auth header if skipAuth flag is set
    if (!context.skipAuth) {
      const { userToken } = getAuthState();
      if (userToken) {
        setBearerHeader(headers, userToken);
      }
    }

    // authLinkLogger.debug("Request headers", { headers });
    operation.setContext({ headers });
    return forward(operation);
  });

  return authLink;
}
