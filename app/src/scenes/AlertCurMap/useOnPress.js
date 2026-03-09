import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

import { ANIMATION_DURATION } from "~/containers/Map/constants";

import { alertActions, defibsActions } from "~/stores";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES, UI_SCOPES } from "~/lib/logger/scopes";

import prioritizeFeatures from "./prioritizeFeatures";

const mapLogger = createLogger({
  module: FEATURE_SCOPES.MAP,
  feature: "alert-map-interaction",
});

export default function useOnPress({
  superCluster,
  cameraRef,
  setSelectedFeature,
}) {
  const navigation = useNavigation();
  return useCallback(
    async (event) => {
      const features = prioritizeFeatures(event.features);
      if (!features.length > 0) {
        return;
      }
      const [feature] = features;
      const { properties } = feature;

      if (properties?.isDefib && properties?.defib) {
        defibsActions.setSelectedDefib(properties.defib);
        navigation.navigate("DAEItem");
        return;
      }

      if (properties.cluster) {
        // center and expand to cluster's points
        const { current: camera } = cameraRef;
        camera.setCamera({
          centerCoordinate: feature.geometry.coordinates,
          zoomLevel: superCluster.getClusterExpansionZoom(
            feature.properties.cluster_id,
          ),
          animationDuration: ANIMATION_DURATION,
        });
        return;
      }

      if (properties.alert) {
        const { alert } = properties;
        if (alert) {
          if (setSelectedFeature) {
            setSelectedFeature(feature);
          } else {
            alertActions.setNavAlertCur({ alert });
            navigation.navigate("AlertCur", {
              screen: "AlertCurOverview",
            });
          }
        }
        return;
      }

      // mapLogger.debug("Unexpected feature pressed", { features: JSON.stringify(features) });
    },
    [cameraRef, superCluster, setSelectedFeature, navigation],
  );
}
