import { gql } from "@apollo/client";

export const REGISTER_USER_MUTATION = gql`
  mutation registerUser {
    addOneAuthInitToken {
      authTokenJwt
    }
  }
`;

export const LOGIN_USER_TOKEN_MUTATION = gql`
  mutation loginUserToken(
    $authTokenJwt: String!
    $phoneModel: String
    $deviceUuid: ID
  ) {
    doAuthLoginToken(
      authLoginTokenInput: {
        authTokenJwt: $authTokenJwt
        phoneModel: $phoneModel
        deviceUuid: $deviceUuid
      }
    ) {
      userBearerJwt
    }
  }
`;

export const STORE_FCM_TOKEN_MUTATION = gql`
  mutation storeFcmToken($deviceId: Int!, $fcmToken: String!) {
    updateOneDevice(
      pk_columns: { id: $deviceId }
      _set: { fcmToken: $fcmToken }
    ) {
      updatedAt
    }
  }
`;
