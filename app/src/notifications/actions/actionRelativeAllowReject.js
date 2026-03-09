import network from "~/network";

import RELATIVE_ALLOW_REJECT from "~/gql/mutations/relativeAllowReject";

export default async function actionRelativeAllowReject({ data }) {
  const { relativeId } = data;
  await network.apolloClient.mutate({
    mutation: RELATIVE_ALLOW_REJECT,
    variables: {
      relativeId,
    },
  });
}
