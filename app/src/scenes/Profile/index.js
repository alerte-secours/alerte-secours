import React, { useEffect, useRef } from "react";

import { ScrollView, View } from "react-native";

import Loader from "~/components/Loader";
import { useSubscription } from "@apollo/client";
import Error from "~/components/Error";
import * as Sentry from "@sentry/react-native";

import { LOAD_PROFILE_SUBSCRIPTION } from "./gql";

import { useNetworkState, useSessionState } from "~/stores";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

import withConnectivity from "~/hoc/withConnectivity";

import { useIsFocused } from "@react-navigation/native";

import Form from "./Form";

const profileLogger = createLogger({
  module: FEATURE_SCOPES.PROFILE,
  feature: "screen",
});

export default withConnectivity(function Profile({ navigation, route }) {
  const { userId } = useSessionState(["userId"]);
  const { wsClosedDate, wsConnected, hasInternetConnection } = useNetworkState([
    "wsClosedDate",
    "wsConnected",
    "hasInternetConnection",
  ]);
  const isFocused = useIsFocused();

  const lastDataAtRef = useRef(Date.now());
  // profileLogger.debug("Profile user ID", { userId });
  const { data, loading, error, restart } = useSubscription(
    LOAD_PROFILE_SUBSCRIPTION,
    {
      variables: {
        userId,
      },
      skip: !userId,
    },
  );

  useEffect(() => {
    // If the subscription is currently skipped (no userId yet),
    // `restart` might not be available depending on Apollo version.
    if (!userId) return;
    if (typeof restart !== "function") return;
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!wsClosedDate) return;
    if (typeof restart !== "function") return;
    // WS was closed/reconnected; restart the subscription to avoid being stuck.
    try {
      profileLogger.info(
        "WS reconnect detected, restarting profile subscription",
        {
          wsClosedDate,
        },
      );
      restart();
    } catch (_e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsClosedDate]);

  useEffect(() => {
    if (!isFocused) return;
    if (!hasInternetConnection) return;
    if (!wsConnected) return;

    const interval = setInterval(() => {
      const age = Date.now() - lastDataAtRef.current;
      if (age < 45_000) return;

      try {
        Sentry.addBreadcrumb({
          category: "profile",
          level: "warning",
          message: "profile subscription stale, restarting",
          data: { ageMs: age },
        });
      } catch (_e) {
        // ignore
      }

      profileLogger.warn("Profile subscription stale, restarting", {
        ageMs: age,
      });
      try {
        lastDataAtRef.current = Date.now();
        if (typeof restart !== "function") return;
        restart();
      } catch (_e) {
        // ignore
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [hasInternetConnection, isFocused, restart, wsConnected]);

  useEffect(() => {
    if (data?.selectOneUser) {
      lastDataAtRef.current = Date.now();
    }
  }, [data]);

  const clearAuthWaitParams = React.useCallback(() => {
    navigation.setParams({
      waitingSmsType: undefined,
      openAccountModal: undefined,
    });
  }, [navigation]);

  if (!userId) {
    return <Loader />;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    profileLogger.error("Profile subscription error", { error });
    return <Error />;
  }

  if (!data?.selectOneUser) {
    // No error surfaced, but no payload either. Avoid infinite loader.
    profileLogger.error("Profile subscription returned no user", { userId });
    return <Error />;
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 15,
      }}
    >
      <Form
        profileData={data}
        openAccountModal={route.params?.openAccountModal}
        waitingSmsType={route.params?.waitingSmsType}
        clearAuthWaitParams={clearAuthWaitParams}
      />
    </ScrollView>
  );
});
