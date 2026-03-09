import { gql } from "@apollo/client";

export const ALERTED_FIELDS = gql`
  fragment alertedViewFields on alerted {
    id
    # alertId
    archivedAlertId
    createdAt
    # updatedAt
    nearLocation
    comingHelp
    reason
    relativeUserId
    oneArchivedAlert {
      id
      level
      subject
      radius
      alertTag
      location
      createdAt
      address
      what3Words
      nearestPlace
      username
      code
      notifyAround
      notifyRelatives
      notifiedCount
      userId
    }
  }
`;

export const ALERTED_SUBSCRIPTION = gql`
  ${ALERTED_FIELDS}
  subscription alertedSubscription($cursor: bigint!) {
    selectStreamAlerted(
      cursor: { initial_value: { id: $cursor }, ordering: ASC }
      batch_size: 100
    ) {
      ...alertedViewFields
    }
  }
`;

export const ALERTED_QUERY = gql`
  ${ALERTED_FIELDS}
  query alertedQuery {
    selectManyAlerted(order_by: { id: asc }) {
      ...alertedViewFields
    }
  }
`;
