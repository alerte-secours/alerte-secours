import network from "~/network";

import CLOSE_ALERT from "~/gql/mutations/closeAlert";

export default async function actionCloseAlert({ data }) {
  const { alertId } = data;
  await network.apolloClient.mutate({
    mutation: CLOSE_ALERT,
    variables: {
      alertId,
    },
  });
}
