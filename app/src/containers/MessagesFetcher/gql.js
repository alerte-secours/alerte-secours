import { gql } from "@apollo/client";

export const MESSAGE_FIELDS = gql`
  fragment MessageFields on message {
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
  }
`;

export const SELECT_MANY_MESSAGE_QUERY = gql`
  query selectManyMessageQuery($alertId: Int!) {
    selectManyMessage(
      where: { alertId: { _eq: $alertId } }
      order_by: { id: asc }
    ) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;

export const SELECT_STREAM_MESSAGE_SUBSCRIPTION = gql`
  subscription selectStreamMessageSubscription($alertId: Int!, $cursor: Int) {
    selectStreamMessage(
      where: { alertId: { _eq: $alertId } }
      cursor: { initial_value: { id: $cursor }, ordering: ASC }
      batch_size: 30
    ) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;

export const ARCHIVED_MESSAGE_FIELDS = gql`
  fragment ArchivedMessageFields on archived_message {
    id
    archivedAlertId
    createdAt
    location
    contentType
    text
    audioFileUuid
    username
    userId
    avatarImageFileUuid
  }
`;

export const SELECT_MANY_ARCHIVED_MESSAGE_QUERY = gql`
  query selectManyArchivedMessageQuery($archivedAlertId: Int!) {
    selectManyArchivedMessage(
      where: { archivedAlertId: { _eq: $archivedAlertId } }
      order_by: { id: desc }
    ) {
      ...ArchivedMessageFields
    }
  }
  ${ARCHIVED_MESSAGE_FIELDS}
`;
