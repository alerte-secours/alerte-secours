import { gql } from "@apollo/client";

export default gql`
  mutation acceptInvitation($relativeInvitationId: Int!) {
    upsertOneRelativeByInvitationId(
      args: { input_relative_invitation_id: $relativeInvitationId }
    ) {
      __typename
    }
  }
`;
