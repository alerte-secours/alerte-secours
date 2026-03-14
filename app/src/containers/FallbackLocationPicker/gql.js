import { gql } from "@apollo/client";

export const QUERY_NOMINATIM_SEARCH = gql`
  query nominatimSearch($q: String!) {
    getOneInfoNominatimSearch(q: $q) {
      results {
        latitude
        longitude
        displayName
      }
    }
  }
`;

export const QUERY_NOMINATIM_REVERSE = gql`
  query nominatimReverse($latitude: Float!, $longitude: Float!) {
    getOneInfoNominatim(lat: $latitude, lon: $longitude) {
      address
    }
  }
`;
