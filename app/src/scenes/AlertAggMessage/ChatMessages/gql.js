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
    oneAlert {
      ...AggMessageAlertFields
    }
  }
`;

export const SELECT_STREAM_MESSAGES_SUBSCRIPTION = gql`
  subscription selectStreamMessageSubscription($cursor: Int) {
    selectStreamMessage(
      cursor: { initial_value: { id: $cursor }, ordering: ASC }
      batch_size: 100
    ) {
      ...AggMessageFields
    }
  }
  ${AGG_MESSAGE_FIELDS_FRAGMENT}
  ${AGG_MESSAGE_ALERT_FIELDS_FRAGMENT}
`;

export const SELECT_MESSAGES_QUERY = gql`
  query selectMessagesQuery {
    selectManyMessage(order_by: { id: asc }) {
      ...AggMessageFields
    }
  }
  ${AGG_MESSAGE_FIELDS_FRAGMENT}
  ${AGG_MESSAGE_ALERT_FIELDS_FRAGMENT}
`;
