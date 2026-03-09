import { gql } from "@apollo/client";

export default gql`
  mutation keepOpenAlert($alertId: Int!) {
    doAlertKeepOpen(alertKeepOpenInput: { alertId: $alertId }) {
      ok
    }
  }
`;
