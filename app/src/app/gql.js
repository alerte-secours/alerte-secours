import { gql } from "@apollo/client";

export const USER_QUERY = gql`
  query userQuery($deviceId: Int!) {
    selectOneDevice(id: $deviceId) {
      id
      radiusAll
      radiusReach
      preferredEmergencyCall
    }
  }
`;

export const LOAD_ALERT_BY_CODE = gql`
  query loadAlertByCodeQuery($code: String!) {
    selectManyAlert(where: { code: { _eq: $code } }, limit: 1) {
      id
      level
      location
    }
  }
`;

export const CONNECT_ALERT = gql`
  mutation connectAlertMutation($accessCode: String!, $code: String!) {
    doAlertConnectAlert(
      alertConnectAlertInput: { accessCode: $accessCode, code: $code }
    ) {
      alertId
      alertingId
    }
  }
`;
