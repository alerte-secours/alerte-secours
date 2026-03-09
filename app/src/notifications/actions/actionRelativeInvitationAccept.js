import network from "~/network";

import RELATIVE_INVITATION_ACCEPT from "~/gql/mutations/relativeInvitationAccept";

export default async function actionRelativeInvitationAccept({ data }) {
  const { relativeInvitationId } = data;
  await network.apolloClient.mutate({
    mutation: RELATIVE_INVITATION_ACCEPT,
    variables: {
      relativeInvitationId,
    },
  });
}
