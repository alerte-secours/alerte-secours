import { gql } from "@apollo/client";

export const ALERTING_QUERY = gql`
  query alertingQuery($alertingId: Int!) {
    selectOneAlerting(id: $alertingId) {
      id
      initialDistance
      reason
      oneAlert {
        id
        alertTag
        code
        level
      }
    }
  }
`;

export const ALERT_QUERY = gql`
  query alertQuery($alertId: Int!) {
    selectOneAlert(id: $alertId) {
      id
      code
      level
    }
  }
`;

export const ALERT_INFOS_QUERY = gql`
  query alertInfosQuery($alertId: Int!) {
    selectOneAlert(id: $alertId) {
      id
      code
      level
      what3Words
      address
      nearestPlace
    }
  }
`;

export const RELATIVE_QUERY = gql`
  query relativeQuery($relativeId: Int!) {
    selectManyViewRelativePhoneNumber(
      where: { relativeId: { _eq: $relativeId } }
    ) {
      onePhoneNumber {
        number
        country
      }
    }
  }
`;

export const RELATIVE_INVITATION_QUERY = gql`
  query relativeInvitationQuery($relativeInvitationId: Int!) {
    selectOneRelativeInvitation(id: $relativeInvitationId) {
      oneUserPhoneNumberRelative {
        id
        onePhoneNumber {
          id
          number
          country
        }
      }
    }
  }
`;
