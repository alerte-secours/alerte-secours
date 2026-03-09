import { getDistance } from "geolib";

import { createAtom } from "~/lib/atomic-zustand";
import { levelNum, numLevel, numMax } from "~/misc/levelNum";

export default createAtom(({ merge, set, get, reset, getActions }) => {
  // Get the aggregatedMessages actions
  const aggregatedMessagesActions = getActions("aggregatedMessages");
  function getMaxAlertingLevel(alertingList) {
    let currentNum = 0;
    for (const {
      oneAlert: { level, state },
    } of alertingList) {
      if (state !== "open") {
        continue;
      }
      const num = levelNum[level];
      if (num > currentNum) {
        currentNum = num;
      }
      if (currentNum >= numMax) {
        break;
      }
    }
    return currentNum ? numLevel[currentNum] : null;
  }

  function computeAlertingList(alertingList, coords) {
    return alertingList.map((row) => {
      const { oneAlert } = row;
      const { coordinates: alertCoords } = oneAlert.location;

      const [longitude, latitude] = alertCoords;
      let distance;
      if (longitude && latitude && coords?.longitude && coords?.latitude) {
        distance = getDistance(
          { longitude, latitude },
          {
            longitude: coords.longitude,
            latitude: coords.latitude,
          },
        );
      }
      return { ...row, alert: { ...oneAlert, distance } };
    });
  }

  const mergeAlertingList = (alertingList, coords) => {
    const initializedAlerts = get("initializedAlerts") || {};
    const newInitializedAlerts = { ...initializedAlerts };

    const processedAlertingList = computeAlertingList(alertingList, coords);

    processedAlertingList.forEach(({ alert }) => {
      if (!initializedAlerts[alert.id]) {
        aggregatedMessagesActions.initializeAlert(alert);
        newInitializedAlerts[alert.id] = true;
      }
    });

    merge({
      alertingList: processedAlertingList,
      alertingListLength: alertingList.filter(
        ({ oneAlert: { state } }) => state === "open",
      ).length,
      maxAlertingLevel: getMaxAlertingLevel(alertingList),
      initializedAlerts: newInitializedAlerts,
    });
  };

  const findAlertById = (id) => {
    const alertingList = get("alertingList");
    return alertingList.find((row) => row.alert.id === id);
  };

  return {
    default: {
      navAlertCur: null,
      alertingList: [],
      alertingListLength: 0,
      maxAlertingLevel: null,
      hasMessages: false,
      initializedAlerts: {}, // Track which alerts have virtual messages
    },
    actions: {
      reset,
      updateLocation: (coords) => {
        const alertingList = get("alertingList");
        mergeAlertingList(alertingList, coords);
      },
      updateAlertingList: (alertingList) => {
        const coords = get("location", "coords");
        mergeAlertingList(alertingList, coords);
        const navAlertCur = get("navAlertCur");
        if (navAlertCur) {
          const foundAlert = findAlertById(navAlertCur.alert.id);
          if (foundAlert) {
            set("navAlertCur", foundAlert);
          }
        }
      },
      setNavAlertCur: (navAlertCur) => {
        if (navAlertCur) {
          const foundAlert = findAlertById(navAlertCur.alert.id);
          if (foundAlert) {
            navAlertCur = foundAlert;
          }
        }
        set("navAlertCur", navAlertCur);
      },
      setHasMessages: (hasMessages) => {
        set("hasMessages", hasMessages);
      },
    },
  };
});
