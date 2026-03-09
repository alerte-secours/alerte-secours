import { gql } from "@apollo/client";

export const LOAD_NOTIFICATIONS_QUERY = gql`
  query loadNotifications($userId: Int!, $limit: Int!, $cursorId: Int) {
    selectManyNotification(
      where: { userId: { _eq: $userId } }
      order_by: [{ acknowledged: asc }, { id: desc }]
      limit: $limit
    ) {
      id
      userId
      type
      message
      data
      acknowledged
      createdAt
    }
    selectAggNotification(where: { userId: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
  }
`;

export const LOAD_NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription loadNotificationsSubscription(
    $userId: Int!
    $cursor: Int
    $limit: Int!
  ) {
    selectStreamNotification(
      where: { userId: { _eq: $userId } }
      batch_size: $limit
      cursor: { initial_value: { id: $cursor }, ordering: ASC }
    ) {
      id
      userId
      type
      message
      data
      acknowledged
      createdAt
    }
  }
`;
