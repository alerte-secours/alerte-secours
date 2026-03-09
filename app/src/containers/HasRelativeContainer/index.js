import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import {
  useParamsState,
  paramsActions,
  useSessionState,
  subscribeParamsState,
  notificationsActions,
} from "~/stores";
import QUERY_HAS_RELATIVE from "~/gql/queries/hasRelative";
import useMount from "~/hooks/useMount";

export default function HasRelativeContainer() {
  const { hasRegisteredRelatives } = useParamsState(["hasRegisteredRelatives"]);
  const { userId } = useSessionState(["userId"]);

  useMount(() => {
    subscribeParamsState(
      ({ hasRegisteredRelatives }) => hasRegisteredRelatives,
      (hasRegisteredRelatives) => {
        notificationsActions.computeProps();
      },
    );
  });

  const [fetchHasRelative, { loading, error, data }] = useLazyQuery(
    QUERY_HAS_RELATIVE,
    {
      variables: {
        userId,
      },
    },
  );

  useEffect(() => {
    if (hasRegisteredRelatives === null) {
      fetchHasRelative();
    }
  }, [hasRegisteredRelatives, fetchHasRelative]);

  useEffect(() => {
    if (!data) {
      return;
    }
    const hasRegisteredRelatives =
      data.selectManyRelative.length > 0 ||
      data.selectManyRelativeUnregistered.length > 0;
    paramsActions.setHasRegisteredRelatives(hasRegisteredRelatives);
  }, [data]);

  // This component doesn't render anything
  return null;
}
