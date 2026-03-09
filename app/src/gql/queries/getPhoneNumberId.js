import { gql } from "@apollo/client";

export default gql`
  query getPhoneNumberId($phoneNumber: String!, $phoneCountry: String!) {
    selectManyPhoneNumber(
      where: { number: { _eq: $phoneNumber }, country: { _eq: $phoneCountry } }
      limit: 1
    ) {
      id
    }
  }
`;
