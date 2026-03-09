import { gql } from "@apollo/client";

export const RADAR_PEOPLE_COUNT_QUERY = gql`
  query radarPeopleCount {
    getOneRadarPeopleCount {
      count
    }
  }
`;
