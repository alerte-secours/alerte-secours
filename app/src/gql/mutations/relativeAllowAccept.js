import { gql } from "@apollo/client";

export default gql`
  mutation relativeAllowAccept($relativeId: Int!) {
    updateManyRelativeAllow(
      where: { relativeId: { _eq: $relativeId } }
      _set: { allowed: true }
    ) {
      affected_rows
    }
  }
`;
