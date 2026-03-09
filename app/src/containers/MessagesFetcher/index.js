import React from "react";
import LiveMessagesFetcher from "./components/LiveMessagesFetcher";
import ArchivedMessagesFetcher from "./components/ArchivedMessagesFetcher";

/**
 * MessagesFetcher acts as a router component that renders either
 * LiveMessagesFetcher or ArchivedMessagesFetcher based on the isArchived prop
 */
const MessagesFetcher = ({ scrollViewRef, data: { alertId }, isArchived }) => {
  // Render the appropriate component based on isArchived flag
  return isArchived ? (
    <ArchivedMessagesFetcher scrollViewRef={scrollViewRef} alertId={alertId} />
  ) : (
    <LiveMessagesFetcher scrollViewRef={scrollViewRef} alertId={alertId} />
  );
};

export default MessagesFetcher;
