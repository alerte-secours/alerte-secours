import { gql } from "@apollo/client";

export const QUERY_GET_WHAT3WORDS = gql`
  query getWhat3Words($latitude: Float!, $longitude: Float!) {
    getOneInfoWhat3Words(lat: $latitude, lon: $longitude) {
      nearestPlace
      words
    }
  }
`;

export const QUERY_GET_NOMINATIM = gql`
  query getNominatim($latitude: Float!, $longitude: Float!) {
    getOneInfoNominatim(lat: $latitude, lon: $longitude) {
      address
    }
  }
`;
