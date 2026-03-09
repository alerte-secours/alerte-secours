import { useCallback } from "react";
import { useLazyQuery } from "@apollo/client";

import { normalizeNumber } from "~/utils/phone";

import IS_PHONE_NUMBER_REGISTERED from "~/gql/queries/isPhoneNumberRegistered";

export default function useCheckPhoneNumberRegistered() {
  const [isPhoneNumberRegistered] = useLazyQuery(IS_PHONE_NUMBER_REGISTERED);

  const checkNumberState = useCallback(
    async (phoneNumber, phoneCountry) => {
      phoneNumber = normalizeNumber(phoneNumber);
      const { data } = await isPhoneNumberRegistered({
        variables: { phoneNumber, phoneCountry },
      });
      const state = {
        isRegistered: data?.selectManyPhoneNumber.length > 0,
        existsAsRelative:
          data?.selectManyPhoneNumber[0]?.oneUserPhoneNumberRelative !== null,
      };
      return state;
    },
    [isPhoneNumberRegistered],
  );

  const checkNumberIsRegistered = useCallback(
    async (phoneNumber, phoneCountry) => {
      const state = await checkNumberState(phoneNumber, phoneCountry);
      return state.isRegistered;
    },
    [checkNumberState],
  );
  const checkNumberExistsAsRelative = useCallback(
    async (phoneNumber, phoneCountry) => {
      const state = await checkNumberState(phoneNumber, phoneCountry);
      return state.existsAsRelative;
    },
    [checkNumberState],
  );
  return {
    checkNumberState,
    checkNumberIsRegistered,
    checkNumberExistsAsRelative,
  };
}
