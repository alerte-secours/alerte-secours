import network from "~/network";

import RELATIVE_ALLOW_ACCEPT from "~/gql/mutations/relativeAllowAccept";

export default async function actionRelativeAllowAccept({ data }) {
  const { relativeId } = data;
  await network.apolloClient.mutate({
    mutation: RELATIVE_ALLOW_ACCEPT,
    variables: {
      relativeId,
    },
  });
}
