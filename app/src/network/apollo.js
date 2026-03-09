import { ApolloClient, ApolloLink } from "@apollo/client";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

import createErrorLink from "./errorLink";
import createAuthLink from "./authLink";
import createRetryLink from "./retryLink";
import createHttpLink from "./httpLink";
import createWsLink from "./wsLink";
import createSplitLink from "./splitLink";
import createCancelLink from "./cancelLink";
import createSentryLink from "./sentryLink";

import createCache from "./cache";

if (__DEV__ || process.env.NODE_ENV !== "production") {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export default function createApolloClient(options) {
  const cache = options.cache || createCache();
  const errorLink = createErrorLink(options);
  const authLink = createAuthLink(options);
  const cancelLink = createCancelLink();
  const retryLink = createRetryLink(options);
  const sentryLink = createSentryLink(options);

  const httpLink = createHttpLink(options);
  const wsLink = createWsLink(options);
  const wsChain = ApolloLink.from([
    sentryLink,
    cancelLink,
    errorLink,
    authLink,
    wsLink,
  ]);

  const httpChain = ApolloLink.from([
    sentryLink,
    cancelLink,
    retryLink,
    errorLink,
    authLink,
    httpLink,
  ]);

  const link = createSplitLink({
    ...options,
    wsLink: wsChain,
    httpLink: httpChain,
  });

  const apolloClient = new ApolloClient({
    cache,
    // connectToDevTools: true, // Enable dev tools for better debugging
    link,
    resolvers: {},
    ssrMode: false,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-and-network",
      },
      query: {
        fetchPolicy: "network-only",
      },
      mutate: {
        fetchPolicy: "no-cache",
      },
    },
  });

  // Add subscription reset helper
  apolloClient.restartWS = () => wsLink.client.restart();

  return apolloClient;
}
