import ky from "ky";
import { getAuthState } from "~/stores";
import { setBearerHeader } from "./headers";
import env from "~/env";

import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

const logger = createLogger({
  module: NETWORK_SCOPES.HTTP,
  feature: "fallback-location-sync",
});

function getUrl() {
  return env.GEOLOC_SYNC_URL.replace(/\/[^/]*$/, "/fallback-sync");
}

export async function saveFallbackLocation(coordinates, label) {
  const url = getUrl();
  const headers = setBearerHeader({}, getAuthState().userToken);

  try {
    await ky.post(url, {
      headers,
      json: { coordinates, label: label || null },
    });
  } catch (error) {
    logger.error("Failed to save fallback location", {
      error: error.message,
    });
    throw error;
  }
}

export async function clearFallbackLocation() {
  const url = getUrl();
  const headers = setBearerHeader({}, getAuthState().userToken);

  try {
    await ky.post(url, {
      headers,
      json: { coordinates: null, label: null },
    });
  } catch (error) {
    logger.error("Failed to clear fallback location", {
      error: error.message,
    });
    throw error;
  }
}
