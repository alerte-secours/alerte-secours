import network from "~/network";

import KEEP_OPEN_ALERT from "~/gql/mutations/keepOpenAlert";

export default async function actionKeepOpenAlert({ data }) {
  const { alertId } = data;
  await network.apolloClient.mutate({
    mutation: KEEP_OPEN_ALERT,
    variables: {
      alertId,
    },
  });
}
