import { gql } from "@apollo/client";

export default gql`
  mutation reopenAlert($alertId: Int!) {
    doAlertReOpen(alertReOpenInput: { alertId: $alertId }) {
      ok
    }
  }
`;
