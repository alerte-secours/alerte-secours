import { useLazyQuery } from "@apollo/client";
import { useCallback } from "react";
import { RADAR_PEOPLE_COUNT_QUERY } from "~/scenes/SendAlert/gql";

export default function useRadarData() {
  const [fetchRadarData, { data, loading: isLoading, error }] = useLazyQuery(
    RADAR_PEOPLE_COUNT_QUERY,
    {
      fetchPolicy: "network-only", // Always fetch fresh data
      errorPolicy: "all",
    },
  );

  const reset = useCallback(() => {
    // Reset is handled by not calling the query again
    // Apollo will manage the state internally
  }, []);

  return {
    data: data?.getOneRadarPeopleCount,
    isLoading,
    error,
    fetchRadarData,
    reset,
    hasLocation: true, // Location is now handled server-side via authentication
  };
}
