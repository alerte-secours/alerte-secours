import { gql } from "@apollo/client";

export const QUERY_GET_NOMINATIM = gql`
  query getNominatim($latitude: Float!, $longitude: Float!) {
    getOneInfoNominatim(lat: $latitude, lon: $longitude) {
      address
      nearestPlace
    }
  }
`;
