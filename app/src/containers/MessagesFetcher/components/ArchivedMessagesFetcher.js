import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import ChatMessages from "~/containers/ChatMessages";
import { SELECT_MANY_ARCHIVED_MESSAGE_QUERY } from "../gql";

const ArchivedMessagesFetcher = ({ scrollViewRef, alertId }) => {
  // Force cache isolation for archived messages
  const cacheContext = useMemo(
    () => ({
      cacheKey: alertId ? `alert:${alertId}` : "aggregate",
    }),
    [alertId],
  );

  // Keep the archived messages query
  const { data: archivedData, loading: archivedLoading } = useQuery(
    SELECT_MANY_ARCHIVED_MESSAGE_QUERY,
    {
      variables: { archivedAlertId: alertId },
      fetchPolicy: "network-only",
      context: cacheContext,
    },
  );

  // Process archived messages
  const messages = useMemo(() => {
    if (archivedLoading) return [];
    const archivedMessages = archivedData?.selectManyArchivedMessage || [];
    return archivedMessages;
  }, [archivedData, archivedLoading]);

  return (
    <ChatMessages
      scrollViewRef={scrollViewRef}
      messages={messages}
      loading={archivedLoading}
    />
  );
};

export default ArchivedMessagesFetcher;
