import { useCallback } from "react";
import { useMutation } from "@apollo/client";

function withError(fn) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (...args) => {
      const result = {};
      try {
        const { data, errors } = await fn(...args);
        result.data = data;
        result.errors = errors;
      } catch (error) {
        // maybe related to https://github.com/apollographql/apollo-link/issues/828
        if (
          error.name === "ApolloError" &&
          error.message === "Error message not found."
        ) {
          if (error.networkError?.graphQLErrors?.[0]?.extensions?.statusCode) {
            const { extensions } = error.networkError.graphQLErrors[0];
            error.message =
              extensions.responseBody.message || extensions.statusText;
          }
        }
        if (error.networkError?.graphQLErrors?.[0]?.extensions?.responseBody) {
          result.data =
            error.networkError.graphQLErrors[0].extensions.responseBody;
        } else {
          result.data = null;
        }
        result.errors = [error];
      }
      return result;
    },
    [fn],
  );
}
function useMutationWithError(...args) {
  const [action, ...res] = useMutation(...args);
  return [withError(action), ...res];
}

export { useMutationWithError, withError };
