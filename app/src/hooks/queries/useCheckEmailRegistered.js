import { useCallback } from "react";
import { useLazyQuery } from "@apollo/client";

import IS_EMAIL_REGISTERED from "~/gql/queries/isEmailRegistered";

export default function useCheckEmailRegistered() {
  const [isEmailRegistered] = useLazyQuery(IS_EMAIL_REGISTERED);
  const checkEmailIsRegistered = useCallback(
    async (email) => {
      const { data } = await isEmailRegistered({
        variables: { email },
      });
      return data?.selectManyEmail.length > 0;
    },
    [isEmailRegistered],
  );
  return {
    checkEmailIsRegistered,
  };
}
