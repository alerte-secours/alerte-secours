import axios from "axios";
import axiosRetry from "axios-retry";
import defaultsDeep from "lodash.defaultsdeep";

import { getAuthState } from "~/stores";
import { setBearerHeader } from "./headers";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

const axiosLogger = createLogger({
  module: NETWORK_SCOPES.HTTP,
  feature: "axios-client",
});

export default function createAxios(baseOptions = {}) {
  const instance = axios.create(baseOptions);
  instance.interceptors.request.use(
    function (config) {
      if (!config.headers) {
        config.headers = {};
      }
      const defaultConfig = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      setBearerHeader(defaultConfig.headers, getAuthState().userToken);
      defaultsDeep(config, defaultConfig);
      return config;
    },
    function (error) {
      // axiosLogger.error("Request interceptor error", {
      //   error: error.message,
      //   stack: error.stack
      // });
      return Promise.reject(error);
    },
  );
  instance.interceptors.response.use(
    function (response) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response;
    },
    function (error) {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      if (error.response) {
        // axiosLogger.debug("Response headers", { headers: error.response.headers });
        axiosLogger.error("HTTP response error", {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        });
      } else {
        axiosLogger.error("HTTP request failed", {
          error: error.message,
          stack: error.stack,
        });
      }
      return Promise.reject(error);
    },
  );
  axiosRetry(instance, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
  return instance;
}
