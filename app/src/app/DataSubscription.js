import React from "react";
import { useAuthState, useSessionState } from "~/stores";
import {
  AlertingSubscription,
  NotificationsSubscription,
  AggregatedMessagesSubscription,
} from "./subscriptions";

function Subscriptions() {
  return (
    <>
      <AlertingSubscription />
      <NotificationsSubscription />
      <AggregatedMessagesSubscription />
    </>
  );
}

export default function DataSubscription() {
  const authState = useAuthState(["initialized"]);
  const sessionState = useSessionState(["initialized"]);

  if (!(authState.initialized && sessionState.initialized)) {
    return null;
  }

  return <Subscriptions />;
}
