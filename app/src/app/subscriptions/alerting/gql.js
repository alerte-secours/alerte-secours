import { gql } from "@apollo/client";

const ALERT_FIELDS_FRAGMENT = gql`
  fragment AlertFields on alert {
    id
    level
    subject
    state
    radius
    alertTag
    location
    initialLocation
    createdAt
    closedAt
    address
    what3Words
    nearestPlace
    lastAddress
    lastWhat3Words
    lastNearestPlace
    username
    code
    notifiedCount # deprecated
    notifyRelatives
    notifyAround
    alertingAroundCount
    alertingRelativeCount
    alertingConnectCount
    acknowledgedRelativeCount
    acknowledgedAroundCount
    acknowledgedConnectCount
    followLocation
    accessCode
    userId
    keepOpenAt
    avatarImageFileUuid
  }
`;

const ALERTING_FIELDS_FRAGMENT = gql`
  fragment AlertingFields on alerting {
    id
    alertId
    createdAt
    updatedSeq
    nearLocation
    comingHelp
    reason
    relativeUserId
    acknowledged
    oneAlert {
      ...AlertFields
    }
  }
`;

export const ALERTING_SUBSCRIPTION = gql`
  subscription alertingSubscription($cursor: bigint!) {
    selectStreamAlerting(
      cursor: { initial_value: { updatedSeq: $cursor }, ordering: ASC }
      batch_size: 30
    ) {
      ...AlertingFields
    }
  }
  ${ALERTING_FIELDS_FRAGMENT}
  ${ALERT_FIELDS_FRAGMENT}
`;

export const ALERTING_QUERY = gql`
  query alertingQuery {
    selectManyAlerting(limit: 100, order_by: { updatedSeq: asc }) {
      ...AlertingFields
    }
  }
  ${ALERTING_FIELDS_FRAGMENT}
  ${ALERT_FIELDS_FRAGMENT}
`;

export const ACKNOWLEDGE_ALERTING_MUTATION = gql`
  mutation doAknowledgeAlerting($alertingId: Int!) {
    doAknowledgeAlerting(args: { input_alerting_id: $alertingId }) {
      id
    }
  }
`;
