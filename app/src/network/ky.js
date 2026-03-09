import ky from "ky";
import defaultsDeep from "lodash.defaultsdeep";

import { getAuthState } from "~/stores";
import { setBearerHeader } from "./headers";

export default function createKy(baseOptions = {}, config = {}) {
  const { store } = config;
  const defaultOptions = {
    retry: {
      limit: 3,
      methods: ["get", "put", "head", "delete", "options", "trace"],
      statusCodes: ["401", "408", "413", "429", "500", "502", "503", "504"],
    },
    hooks: {
      beforeRequest: [
        (request) => {
          const headers = setBearerHeader({}, getAuthState().userToken);
          for (const key of Object.keys(headers)) {
            if (!request.headers.get(key)) {
              request.headers.set(key, headers[key]);
            }
          }
        },
      ],
      beforeRetry: [
        async ({ request, _options, error, _retryCount }) => {
          const { response } = error;
          if (response.statusCode === 401) {
            const { authActions, getAuthState } = store;
            await authActions().reload();
            const headers = setBearerHeader({}, getAuthState().userToken);
            for (const key of Object.keys(headers)) {
              request.headers.set(key, headers[key]);
            }
          }
        },
      ],
      afterResponse: [
        (_request, _options, response) => {
          if (!response.ok) {
            console.log(response.status, response.statusText);
          }
        },
      ],
    },
  };
  const options = defaultsDeep({}, baseOptions, defaultOptions);
  const instance = ky.create(options);
  return instance;
}
