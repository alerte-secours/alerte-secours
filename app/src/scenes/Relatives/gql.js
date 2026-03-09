import { gql } from "@apollo/client";

export const RELATIVES_SUBSCRIPTION = gql`
  subscription relatives($userId: Int!) {
    selectOneUser(id: $userId) {
      # user config
      manyPhoneNumber {
        id
        number
        country
      }
      oneUserPhoneNumberRelative {
        id
        onePhoneNumber {
          id
          number
          country
        }
      }

      # owner
      manyRelative {
        id
        oneViewRelativePhoneNumber {
          onePhoneNumberAsTo {
            id
            country
            number
          }
        }
        oneRelativeAllow {
          id
          allowed
        }
      }
      manyRelativeUnregistered {
        id
        phoneNumber
        phoneCountry
      }
      manyRelativeInvitation {
        id
        oneUserPhoneNumberRelativeAsTo {
          id
          onePhoneNumber {
            id
            country
            number
          }
        }
      }

      # other
      manyRelativeAsTo {
        oneViewRelativePhoneNumber {
          onePhoneNumber {
            id
            country
            number
          }
        }
        oneRelativeAllow {
          id
          allowed
        }
      }
      manyRelativeInvitationAsTo {
        id
        oneUserPhoneNumberRelative {
          id
          onePhoneNumber {
            id
            country
            number
          }
        }
      }
    }
  }
`;

export const UPSERT_ONE_RELATIVE_BY_PHONE_NUMBER_ID_MUTATION = gql`
  mutation upsertOneRelativeByPhoneNumberId($inputPhoneNumberId: Int!) {
    upsertOneRelativeByPhoneNumberId(
      args: { input_phone_number_id: $inputPhoneNumberId }
    ) {
      __typename
    }
  }
`;

export const INSERT_ONE_RELATIVE_UNREGISTERED_MUTATION = gql`
  mutation insertOneRelativeUnregistered(
    $phoneNumber: String!
    $phoneCountry: String!
  ) {
    insertOneRelativeUnregistered(
      object: { phoneNumber: $phoneNumber, phoneCountry: $phoneCountry }
    ) {
      __typename
    }
  }
`;

export const UPSERT_ONE_RELATIVE_INVITATION_MUTATION = gql`
  mutation upsertOneRelativeInvitation($phoneNumberId: Int!) {
    upsertOneRelativeInvitationByPhoneNumberId(
      args: { input_phone_number_id: $phoneNumberId }
    ) {
      __typename
    }
  }
`;

export const ACCEPT_INVATION_MUTATION = gql`
  mutation acceptInvitation($relativeInvitationId: Int!) {
    upsertOneRelativeByInvitationId(
      args: { input_relative_invitation_id: $relativeInvitationId }
    ) {
      __typename
    }
  }
`;

export const DELETE_INVITATION_MUTATION = gql`
  mutation deleteInvitation($relativeInvitationId: Int!) {
    deleteOneRelativeInvitation(id: $relativeInvitationId) {
      id
    }
  }
`;

export const ALLOW_FROM_NUMBER_MUTATION = gql`
  mutation allowFromNumber($relativeAllowId: Int!) {
    updateOneRelativeAllow(
      pk_columns: { id: $relativeAllowId }
      _set: { allowed: true }
    ) {
      id
    }
  }
`;

export const DENY_FROM_NUMBER_MUTATION = gql`
  mutation denyFromNumber($relativeAllowId: Int!) {
    updateOneRelativeAllow(
      pk_columns: { id: $relativeAllowId }
      _set: { allowed: false }
    ) {
      id
    }
  }
`;

export const UPSERT_USER_PHONE_NUMBER_RELATIVE_MUTATION = gql`
  mutation upsertUserPhoneNumberRelative($phoneNumberId: Int!) {
    insertOneUserPhoneNumberRelative(
      object: { phoneNumberId: $phoneNumberId }
      on_conflict: {
        constraint: user_phone_number_relative_user_id_key
        update_columns: [phoneNumberId]
      }
    ) {
      __typename
    }
  }
`;

export const REMOVE_RELATIVE_MUTATION = gql`
  mutation removeRelative($id: Int!) {
    deleteOneRelative(id: $id) {
      __typename
    }
  }
`;

export const REMOVE_RELATIVE_UNREGISTERED_MUTATION = gql`
  mutation removeRelativeUnregistered($id: Int!) {
    deleteOneRelativeUnregistered(id: $id) {
      __typename
    }
  }
`;
