import { gql } from "@apollo/client";

export default gql`
  mutation relativeAllowReject($relativeId: Int!) {
    updateManyRelativeAllow(
      where: { relativeId: { _eq: $relativeId } }
      _set: { allowed: false }
    ) {
      affected_rows
    }
  }
`;
