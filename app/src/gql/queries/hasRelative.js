import { gql } from "@apollo/client";

export default gql`
  query hasRelative($userId: Int!) {
    selectManyRelative(where: { userId: { _eq: $userId } }, limit: 1) {
      id
    }
    selectManyRelativeUnregistered(limit: 1) {
      id
    }
  }
`;
