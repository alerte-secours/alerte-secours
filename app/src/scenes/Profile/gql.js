import { gql } from "@apollo/client";

export const LOAD_PROFILE_SUBSCRIPTION = gql`
  subscription loadProfile($userId: Int!) {
    selectOneUser(id: $userId) {
      username
      manyEmail {
        email
        verified
        verificationEmailSentTime
      }
      manyPhoneNumber(
        where: { userId: { _eq: $userId } }
        order_by: { createdAt: desc }
      ) {
        id
        deviceId
        country
        number
        isPrivate
        oneUserPhoneNumberRelative {
          id
        }
      }
      oneUserAvatar {
        imageFileUuid
      }
      oneUserLoginRequest {
        id
        type
        onePhoneNumber {
          id
          country
          number
        }
        oneEmail {
          id
          email
        }
      }
    }
  }
`;

export const UPDATE_PHONE_NUMBER_ISPRIVATE_MUTATION = gql`
  mutation updatePhoneNumberIsPrivate($id: Int!, $isPrivate: Boolean!) {
    updateOnePhoneNumber(
      _set: { isPrivate: $isPrivate }
      pk_columns: { id: $id }
    ) {
      __typename
    }
  }
`;

export const REMOVE_PHONE_NUMBER_MUTATION = gql`
  mutation removePhoneNumber($id: Int!) {
    deleteOnePhoneNumber(id: $id) {
      __typename
    }
  }
`;

export const SAVE_PROFILE_MUTATION = gql`
  mutation saveProfile($email: String!, $userId: Int!, $username: String!) {
    deleteManyEmail(
      where: { userId: { _eq: $userId }, email: { _neq: $email } }
    ) {
      __typename
    }
    insertOneEmail(
      object: { email: $email }
      on_conflict: { constraint: email_user_id_key, update_columns: [] }
    ) {
      __typename
    }
    updateOneUser(pk_columns: { id: $userId }, _set: { username: $username }) {
      __typename
    }
  }
`;

export const RESEND_VERIFICATION_EMAIL_MUTATION = gql`
  mutation resendVerificationEmail($email: String!) {
    doAuthEmailResendVerificationEmail(
      authEmailResendVerificationEmailInput: { email: $email }
    ) {
      ok
    }
  }
`;

export const DELETE_LOGIN_REQUEST_MUTATION = gql`
  mutation deleteLoginRequest($id: Int!) {
    deleteOneUserLoginRequest(id: $id) {
      __typename
    }
  }
`;

export const LOGIN_CONFIRM_MUTATION = gql`
  mutation doAuthLoginConfimLoginRequest(
    $loginRequestId: Int!
    $deviceUuid: ID
  ) {
    doAuthLoginConfimLoginRequest(
      authLoginConfimLoginRequestInput: {
        loginRequestId: $loginRequestId
        deviceUuid: $deviceUuid
      }
    ) {
      authTokenJwt
    }
  }
`;

export const SEND_CONNECTION_EMAIL_MUTATION = gql`
  mutation doAuthLoginConfimLoginRequest($email: String!) {
    doAuthEmailSendConnectionEmail(
      authEmailSendConnectionEmailInput: { email: $email }
    ) {
      ok
    }
  }
`;

export const DESTROY_USER_MUTATION = gql`
  mutation destroyUser {
    doUserDestroy(userDestroyInput: {}) {
      ok
    }
  }
`;

export const AUTH_IMPERSONATE = gql`
  mutation authImpersonate($target: String!) {
    doAuthImpersonateToken(authImpersonateTokenInput: { target: $target }) {
      authTokenJwt
    }
  }
`;
