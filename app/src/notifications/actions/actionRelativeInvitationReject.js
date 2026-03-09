import network from "~/network";

import RELATIVE_INVITATION_REJECT from "~/gql/mutations/relativeInvitationReject";

export default async function actionRelativeInvitationReject({ data }) {
  const { relativeInvitationId } = data;
  await network.apolloClient.mutate({
    mutation: RELATIVE_INVITATION_REJECT,
    variables: {
      relativeInvitationId,
    },
  });
}
