import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

import { ANIMATION_DURATION } from "~/containers/Map/constants";

import { alertActions } from "~/stores";

import prioritizeFeatures from "./prioritizeFeatures";

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
            navigation.navigate({
              name: "AlertCur",
              params: {
                screen: "AlertCurTab",
                params: {
                  screen: "AlertCurOverview",
                },
              },
            });
          }
        }
        return;
      }

      // console.log("Unexpected feature pressed", JSON.stringify(features));
    },
    [cameraRef, superCluster, setSelectedFeature, navigation],
  );
}
