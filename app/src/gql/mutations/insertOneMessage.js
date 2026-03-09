import { gql } from "@apollo/client";
import { MESSAGE_FIELDS } from "~/containers/MessagesFetcher/gql";

export default gql`
  mutation insertOneMessage(
    $alertId: Int!
    $text: String!
    $location: geography
  ) {
    insertOneMessage(
      object: { alertId: $alertId, text: $text, location: $location }
    ) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
