import { gql } from "@apollo/client";

export const SEND_ALERT_MUTATION = gql`
  mutation sendAlert($alertSendAlertInput: AlertSendAlertInput!) {
    doAlertSendAlert(alertSendAlertInput: $alertSendAlertInput) {
      alertId
      code
      accessCode
    }
  }
`;
