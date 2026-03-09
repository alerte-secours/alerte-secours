import { gql } from "@apollo/client";

export default gql`
  mutation deleteInvitation($relativeInvitationId: Int!) {
    deleteOneRelativeInvitation(id: $relativeInvitationId) {
      id
    }
  }
`;
