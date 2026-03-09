import { gql } from "@apollo/client";

export default gql`
  mutation comingHelp(
    $id: Int!
    $alertId: Int!
    $text: String!
    $location: geography
  ) {
    insertOneMessage(
      object: { alertId: $alertId, text: $text, location: $location }
    ) {
      id
    }
    updateOneAlerting(pk_columns: { id: $id }, _set: { comingHelp: true }) {
      id
    }
  }
`;
