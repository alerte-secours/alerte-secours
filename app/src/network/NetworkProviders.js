import React, { useEffect, useState } from "react";
import ComposeComponents from "~/lib/react/ComposeComponents";

import { ApolloProvider } from "@apollo/client";

import createApolloClient from "~/network/apollo";

// import createAxios from "~/network/axios";
import createKy from "~/network/ky";

import network from "~/network";

import env from "~/env";

import Loader from "~/components/Loader";

import * as store from "~/stores";

import getRetryMaxAttempts from "./getRetryMaxAttemps";

import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";
import createCache from "./cache";

const { useNetworkState, networkActions } = store;

const networkProvidersLogger = createLogger({
  module: NETWORK_SCOPES.APOLLO,
  feature: "NetworkProviders",
});

const sharedApolloCache = createCache();

const initializeNewApolloClient = (reload) => {
  if (reload) {
    const { apolloClient } = network;
    apolloClient.stop();
    if (apolloClient.cache !== sharedApolloCache) {
      apolloClient.clearStore();
    }
  }

  network.apolloClient = createApolloClient({
    store,
    GRAPHQL_URL: env.GRAPHQL_URL,
    GRAPHQL_WS_URL: env.GRAPHQL_WS_URL,
    getRetryMaxAttempts,
    cache: sharedApolloCache,
  });
};
initializeNewApolloClient();

// const oaFilesAxios = createAxios({ baseURL: env.OA_FILES_URL });
// network.oaFilesAxios = oaFilesAxios;
const oaFilesKy = createKy({ prefixUrl: env.OA_FILES_URL + "/" }, { store });
network.oaFilesKy = oaFilesKy;

export default function NetworkProviders({ children }) {
  const [key, setKey] = useState(0);
  const [transportClient, setTransportClient] = useState(
    () => network.apolloClient,
  );

  const networkState = useNetworkState([
    "initialized",
    "triggerReload",
    "reloadKind",
    "transportGeneration",
  ]);
  useEffect(() => {
    if (networkState.triggerReload) {
      networkProvidersLogger.debug("Network triggerReload received", {
        reloadKind: networkState.reloadKind,
        reloadId: store.getAuthState()?.reloadId,
        hasUserToken: !!store.getAuthState()?.userToken,
      });

      const isFullReload = networkState.reloadKind !== "transport";
      initializeNewApolloClient(true);

      if (isFullReload) {
        setTransportClient(network.apolloClient);
        setKey((prevKey) => prevKey + 1);
      } else {
        setTransportClient(network.apolloClient);
        networkProvidersLogger.debug("Network transport recovered in place", {
          reloadId: store.getAuthState()?.reloadId,
          hasUserToken: !!store.getAuthState()?.userToken,
          transportGeneration: networkState.transportGeneration,
        });
        networkActions.onReload();
      }
    }
  }, [
    networkState.triggerReload,
    networkState.reloadKind,
    networkState.transportGeneration,
  ]);

  useEffect(() => {
    if (key > 0) {
      networkProvidersLogger.debug("Network reloaded", {
        reloadKind: networkState.reloadKind,
        reloadId: store.getAuthState()?.reloadId,
        hasUserToken: !!store.getAuthState()?.userToken,
      });
      networkActions.onReload();
    }
  }, [key, networkState.reloadKind]);

  if (!networkState.initialized) {
    return <Loader />;
  }

  const providers = [[ApolloProvider, { client: transportClient }]];

  return (
    <ComposeComponents key={key} components={providers}>
      {children}
    </ComposeComponents>
  );
}
