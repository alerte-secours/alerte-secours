import { gql } from "@apollo/client";

export { default as COMING_HELP_MUTATION } from "~/gql/mutations/comingHelp";
export { default as CLOSE_ALERT } from "~/gql/mutations/closeAlert";
export { default as REOPEN_ALERT } from "~/gql/mutations/reopenAlert";
export { default as KEEP_OPEN_ALERT } from "~/gql/mutations/keepOpenAlert";

export const MANY_RELATIVE_QUERY = gql`
  query manyRelative($userId: Int!) {
    selectManyRelative(where: { userId: { _eq: $userId } }) {
      id
      oneViewRelativePhoneNumber {
        onePhoneNumberAsTo {
          id
          country
          number
        }
      }
      oneRelativeAllow {
        id
        allowed
      }
    }
    selectManyRelativeUnregistered {
      id
      phoneNumber
      phoneCountry
    }
  }
`;

export const NOTIFY_AROUND_MUTATION = gql`
  mutation notifyAround($alertId: Int!) {
    doAlertNotifyAround(alertNotifyAroundInput: { alertId: $alertId }) {
      ok
    }
  }
`;

export const NOTIFY_RELATIVES_MUTATION = gql`
  mutation notifyRelatives($alertId: Int!) {
    doAlertNotifyRelatives(alertNotifyRelativesInput: { alertId: $alertId }) {
      ok
    }
  }
`;

export const UPDATE_ALERT_LEVEL_MUTATION = gql`
  mutation updateAlertLevel($alertId: Int!, $level: enum_alert_level_enum!) {
    updateOneAlert(pk_columns: { id: $alertId }, _set: { level: $level }) {
      id
    }
  }
`;

export const UPDATE_ALERT_SUBJECT_MUTATION = gql`
  mutation updateAlertSubject($alertId: Int!, $subject: String!) {
    updateOneAlert(pk_columns: { id: $alertId }, _set: { subject: $subject }) {
      id
    }
  }
`;

export const UPDATE_ALERT_FOLLOW_LOCATION_MUTATION = gql`
  mutation updateAlertFollowLocation(
    $alertId: Int!
    $followLocation: Boolean!
  ) {
    updateOneAlert(
      pk_columns: { id: $alertId }
      _set: { followLocation: $followLocation }
    ) {
      id
    }
  }
`;
