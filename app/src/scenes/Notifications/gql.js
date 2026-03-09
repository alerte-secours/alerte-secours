import { gql } from "@apollo/client";

// Delete notification mutation
export const DELETE_NOTIFICATION = gql`
  mutation deleteNotification($id: Int!) {
    deleteOneNotification(id: $id) {
      __typename
    }
  }
`;

// Mark notification as read mutation
export const MARK_NOTIFICATION_AS_READ = gql`
  mutation markNotificationAsRead($notificationId: Int!) {
    updateOneNotification(
      _set: { acknowledged: true }
      pk_columns: { id: $notificationId }
    ) {
      id
      acknowledged
    }
  }
`;
