import { gql } from "@apollo/client";

export default gql`
  query isEmailRegistered($email: String!) {
    lookupEmailRegistered(args: { check_email: $email }) {
      registered
    }
  }
`;
