import { createAtom } from "~/lib/atomic-zustand";

import sessionVarsFromJWT from "./sessionVarsFromJWT";

import {
  DEFAULT_DEVICE_RADIUS_ALL,
  DEFAULT_DEVICE_RADIUS_REACH,
} from "~/misc/devicePrefs";

export default createAtom(({ merge }) => {
  const defaultValues = {
    initialized: false,
    allowedRoles: [],
    defaultRole: null,
    userId: null,
    deviceId: null,
    radiusAll: DEFAULT_DEVICE_RADIUS_ALL,
    radiusReach: DEFAULT_DEVICE_RADIUS_REACH,
  };
  return {
    default: defaultValues,
    actions: {
      loadSessionFromJWT: (jwt) =>
        merge({
          ...sessionVarsFromJWT(jwt),
          initialized: true,
        }),
      loadUserPreference: ({ radiusAll, radiusReach }) =>
        merge({
          radiusAll: radiusAll || DEFAULT_DEVICE_RADIUS_ALL,
          radiusReach: radiusReach || DEFAULT_DEVICE_RADIUS_REACH,
        }),
      clear: () => {
        merge({ ...defaultValues });
      },
    },
  };
});
