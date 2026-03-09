import { gql } from "@apollo/client";

const AGG_MESSAGE_ALERT_FIELDS_FRAGMENT = gql`
  fragment AggMessageAlertFields on alert {
    id
    code
    createdAt
  }
`;

const AGG_MESSAGE_FIELDS_FRAGMENT = gql`
  fragment AggMessageFields on message {
    id
    alertId
    createdAt
    location
    contentType
    text
    audioFileUuid
    username
    userId
    avatarImageFileUuid
    isOptimistic @client
    oneAlert {
      ...AggMessageAlertFields
    }
  }
`;

export const AGGREGATED_MESSAGES_SUBSCRIPTION = gql`
  subscription aggregatedMessagesSubscription($cursor: Int) {
    selectStreamMessage(
      cursor: { initial_value: { id: $cursor }, ordering: ASC }
      batch_size: 30
    ) {
      ...AggMessageFields
    }
  }
  ${AGG_MESSAGE_FIELDS_FRAGMENT}
  ${AGG_MESSAGE_ALERT_FIELDS_FRAGMENT}
`;

export const AGGREGATED_MESSAGES_QUERY = gql`
  query aggregatedMessagesQuery {
    selectManyMessage(order_by: { id: asc }) {
      ...AggMessageFields
    }
  }
  ${AGG_MESSAGE_FIELDS_FRAGMENT}
  ${AGG_MESSAGE_ALERT_FIELDS_FRAGMENT}
`;
