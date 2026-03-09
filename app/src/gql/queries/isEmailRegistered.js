import { gql } from "@apollo/client";

export default gql`
  query isEmailRegistered($email: String!) {
    selectManyEmail(where: { email: { _eq: $email } }, limit: 1) {
      __typename
    }
  }
`;
