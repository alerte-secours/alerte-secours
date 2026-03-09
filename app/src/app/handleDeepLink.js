import { URL } from "react-native-url-polyfill";
import { alertActions, navActions } from "~/stores";
import { Linking } from "react-native";
import * as Sentry from "@sentry/react-native";
import { createLogger } from "~/lib/logger";
import { NAVIGATION_SCOPES } from "~/lib/logger/scopes";

import network from "~/network";
import { LOAD_ALERT_BY_CODE, CONNECT_ALERT } from "./gql";

const deepLinkLogger = createLogger({
  module: NAVIGATION_SCOPES.DEEP_LINK,
  feature: "handler",
});

export async function handleInitialURL() {
  try {
    deepLinkLogger.info("Checking for initial deep link URL");
    const url = await Linking.getInitialURL();
    if (url) {
      deepLinkLogger.debug("Initial URL found", { url });
      await handleDeepLink(url);
    } else {
      deepLinkLogger.debug("No initial URL found");
    }
  } catch (error) {
    deepLinkLogger.error("Failed to get initial URL", {
      error: error.message,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: {
        source: "deeplink_handler",
        type: "initial_url_error",
      },
    });
  }
}

export default async function handleDeepLink(url) {
  try {
    deepLinkLogger.info("Processing deep link", { url });

    if (!url) {
      const error = new Error("Received empty URL in handleDeepLink");
      deepLinkLogger.warn("Empty URL received");
      Sentry.captureException(error, {
        tags: {
          source: "deeplink_handler",
          type: "empty_url",
        },
      });
      return;
    }

    // Validate URL format
    let urlObject;
    try {
      urlObject = new URL(url);
      deepLinkLogger.debug("URL parsed successfully", {
        pathname: urlObject.pathname,
        search: urlObject.search,
      });
    } catch (error) {
      deepLinkLogger.error("Invalid URL format", {
        url,
        error: error.message,
      });
      Sentry.captureException(error, {
        tags: {
          source: "deeplink_handler",
          type: "invalid_url_format",
        },
        extra: { url },
      });
      return;
    }

    const pathname = urlObject.pathname.slice(1);
    if (!pathname.startsWith("code/")) {
      deepLinkLogger.warn("Invalid pathname format", { pathname });
      return;
    }

    let code;
    try {
      code = decodeURIComponent(pathname.split("/")[1]);
      deepLinkLogger.debug("Code extracted from URL", { code });
    } catch (error) {
      deepLinkLogger.error("Failed to decode URL component", {
        pathname,
        error: error.message,
      });
      Sentry.captureException(error, {
        tags: {
          source: "deeplink_handler",
          type: "decode_error",
        },
        extra: { pathname },
      });
      return;
    }

    let accessCode;
    let coordinates;

    const qParam = urlObject.searchParams.get("q");
    if (qParam) {
      deepLinkLogger.debug("Processing URL parameters", { qParam });
      // Parse format: c:token~l:lat,lng
      const parts = qParam.split("~");
      const codeMatch = parts[0]?.match(/^c:(.+)$/);
      const locationMatch = parts[1]?.match(/^l:(.+)$/);

      if (codeMatch) {
        accessCode = codeMatch[1];
        deepLinkLogger.debug("Access code extracted", { hasAccessCode: true });
      }

      if (locationMatch) {
        const coordParts = locationMatch[1].split(",");
        if (coordParts.length !== 2) {
          deepLinkLogger.warn("Invalid coordinates format", { locationMatch });
          return;
        }

        const latitude = parseFloat(coordParts[0]);
        const longitude = parseFloat(coordParts[1]);

        if (isNaN(latitude) || isNaN(longitude)) {
          deepLinkLogger.warn("Invalid coordinate values", {
            latitude,
            longitude,
          });
          return;
        }

        coordinates = { latitude, longitude };
        deepLinkLogger.debug("Coordinates extracted", { coordinates });
      }
    }

    if (!(code && accessCode)) {
      deepLinkLogger.warn("Missing required parameters", {
        hasCode: !!code,
        hasAccessCode: !!accessCode,
      });
      return;
    }

    try {
      deepLinkLogger.info("Connecting to alert", { code });
      await network.apolloClient.mutate({
        mutation: CONNECT_ALERT,
        variables: {
          code,
          accessCode,
        },
      });

      deepLinkLogger.debug("Loading alert details");
      const { data } = await network.apolloClient.query({
        query: LOAD_ALERT_BY_CODE,
        variables: {
          code,
        },
      });

      const [foundAlert] = data?.selectManyAlert || [];

      if (!foundAlert) {
        deepLinkLogger.warn("Alert not found", { code });
        navActions.setNextNavigation([
          {
            name: "NotFoundOrExpired",
          },
        ]);
        return;
      }

      const { id: alertId, level, location } = foundAlert;

      // Ensure we have valid coordinates either from URL or location
      if (
        !coordinates &&
        (!location?.coordinates?.latitude || !location?.coordinates?.longitude)
      ) {
        deepLinkLogger.warn("Missing valid coordinates", {
          hasUrlCoords: !!coordinates,
          hasLocationCoords: !!(
            location?.coordinates?.latitude && location?.coordinates?.longitude
          ),
        });
        return;
      }

      const { latitude, longitude } = coordinates || location.coordinates;
      const alert = {
        id: alertId,
        level,
        longitude,
        latitude,
      };

      deepLinkLogger.info("Alert found and validated", {
        alertId,
        level,
        hasCoordinates: true,
      });

      alertActions.setNavAlertCur({ alert });
      navActions.setNextNavigation([
        {
          name: "AlertCur",
          params: {
            screen: "AlertCurTab",
          },
        },
      ]);
      deepLinkLogger.debug("Navigation set to alert view");
    } catch (error) {
      deepLinkLogger.error("API operation failed", {
        error: error.message,
        code,
      });
      Sentry.captureException(error, {
        tags: {
          source: "deeplink_handler",
          type: "api_error",
        },
        extra: {
          code,
          accessCode,
        },
      });
      navActions.setNextNavigation([
        {
          name: "NotFoundOrExpired",
        },
      ]);
    }
  } catch (error) {
    deepLinkLogger.error("Unhandled error in deep link processing", {
      error: error.message,
      stack: error.stack,
      url,
    });
    Sentry.captureException(error, {
      tags: {
        source: "deeplink_handler",
        type: "unhandled_error",
      },
      extra: { url },
    });
    navActions.setNextNavigation([
      {
        name: "NotFoundOrExpired",
      },
    ]);
  }
}
// handleDeepLink("https://app.alertesecours.fr/code/Job.Dix.Max.Fix.Us%C3%A9?q=c:trttqM69KMT_L3HvGg71-~l:48.8686133,2.3306067");
