import React from "react";

import { ScrollView, View } from "react-native";

import { Divider } from "react-native-paper";

import Loader from "~/components/Loader";

import withConnectivity from "~/hoc/withConnectivity";

import ToContact from "./ToContact";

import { RELATIVES_SUBSCRIPTION } from "./gql";
import { useSubscription } from "@apollo/client";
import { useSessionState } from "~/stores";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

import DisabledFeature from "./DisabledFeature";
import FromContacts from "./FromContacts";

const relativesLogger = createLogger({
  module: FEATURE_SCOPES.RELATIVES,
  feature: "screen",
});

export default withConnectivity(function Relatives({ navigation, route }) {
  const { userId } = useSessionState(["userId"]);

  const relativesSubscription = useSubscription(RELATIVES_SUBSCRIPTION, {
    variables: {
      userId,
    },
    skip: !userId,
  });

  const { loading, error, data } = relativesSubscription;
  if (!userId) {
    return <Loader />;
  }
  if (loading) {
    return <Loader />;
  }
  if (error) {
    relativesLogger.error("Relatives subscription error", {
      error: error.message,
      stack: error.stack,
      subscription: relativesSubscription,
    });
    return null;
  }

  // relativesLogger.debug("Relatives data", { data: JSON.stringify(data, null, 2) });

  if (data.selectOneUser.manyPhoneNumber.length === 0) {
    return <DisabledFeature />;
  }
  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 15, paddingVertical: 15 }}>
      <View style={{ flex: 1 }}>
        <ToContact data={data} />
      </View>
      <View style={{ flex: 1, paddingTop: 20, paddingBottom: 80 }}>
        <Divider />
        <FromContacts data={data} />
      </View>
    </ScrollView>
  );
});
