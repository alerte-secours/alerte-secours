import React from "react";
import { View } from "react-native";

import ToggleZoomButtonGroup from "~/containers/Map/ToggleZoomButtonGroup";
import StepZoomButtonGroup from "~/containers/Map/StepZoomButtonGroup";
import TargetButton from "~/containers/Map/TargetButton";
import MapLinksPopupIconButton from "~/containers/MapLinksPopup/IconButton";
import ToggleColorSchemeButton from "~/containers/Map/ToggleColorSchemeButton";

import { BoundType } from "~/containers/Map/constants";

export default function ControlButtons({
  mapRef,
  cameraRef,
  boundType,
  setBoundType,
  userCoords,
  setExternalGeoIsVisible,
  refreshCamera,
  setZoomLevel,
  detached,
}) {
  return (
    <>
      <View
        style={{
          position: "absolute",
          bottom: 38,
          left: 4,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <MapLinksPopupIconButton setIsVisible={setExternalGeoIsVisible} />
      </View>
      {(detached || boundType !== BoundType.NAVIGATION) && (
        <TargetButton
          userCoords={userCoords}
          cameraRef={cameraRef}
          boundType={boundType}
          setBoundType={setBoundType}
          refreshCamera={refreshCamera}
        />
      )}
      <ToggleColorSchemeButton containerStyle={{ left: 4, bottom: 75 }} />
      <StepZoomButtonGroup
        mapRef={mapRef}
        cameraRef={cameraRef}
        setZoomLevel={setZoomLevel}
      />
      <ToggleZoomButtonGroup
        boundType={boundType}
        setBoundType={setBoundType}
      />
    </>
  );
}

// const useStyles = createStyles(
//   ({ wp, hp, scaleText, theme: { colors } }) => ({})
// );
