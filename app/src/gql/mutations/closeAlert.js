import { gql } from "@apollo/client";

export default gql`
  mutation closeAlert($alertId: Int!) {
    doAlertClose(alertCloseInput: { alertId: $alertId }) {
      ok
    }
  }
`;
