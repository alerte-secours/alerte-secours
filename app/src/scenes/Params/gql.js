import { gql } from "@apollo/client";

export const DEVICE_PARAMS_SUBSCRIPTION = gql`
  subscription deviceParams($deviceId: Int!) {
    selectOneDevice(id: $deviceId) {
      id
      radiusReach
      radiusAll
      notificationAlertLevel
      preferredEmergencyCall
    }
  }
`;

export const DEVICE_RADIUS_MUTATION = gql`
  mutation deviceRadius(
    $deviceId: Int!
    $radiusReach: numeric!
    $radiusAll: numeric!
  ) {
    updateOneDevice(
      pk_columns: { id: $deviceId }
      _set: { radiusReach: $radiusReach, radiusAll: $radiusAll }
    ) {
      id
    }
  }
`;

export const DEVICE_NOTIFICATION_ALERT_LEVEL_MUTATION = gql`
  mutation notificationAlertLevel(
    $deviceId: Int!
    $notificationAlertLevel: enum_alert_level_enum!
  ) {
    updateOneDevice(
      pk_columns: { id: $deviceId }
      _set: { notificationAlertLevel: $notificationAlertLevel }
    ) {
      id
    }
  }
`;

export const DEVICE_PREFERRED_EMERGENCY_CALL_MUTATION = gql`
  mutation devicePreferredEmergencyCall(
    $deviceId: Int!
    $preferredEmergencyCall: enum_emergency_call_enum!
  ) {
    updateOneDevice(
      pk_columns: { id: $deviceId }
      _set: { preferredEmergencyCall: $preferredEmergencyCall }
    ) {
      id
    }
  }
`;
