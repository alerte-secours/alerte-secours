import React from "react";

import ToggleZoomButtonGroup from "~/containers/Map/ToggleZoomButtonGroup";
import StepZoomButtonGroup from "~/containers/Map/StepZoomButtonGroup";
import TargetButton from "~/containers/Map/TargetButton";
import ToggleColorSchemeButton from "~/containers/Map/ToggleColorSchemeButton";
import { BoundType } from "~/containers/Map/constants";

export default function ControlButtons({
  mapRef,
  cameraRef,
  boundType,
  setBoundType,
  refreshCamera,
  userCoords,
  setZoomLevel,
  detached,
}) {
  // const styles = useStyles();

  return (
    <>
      {(detached || boundType !== BoundType.NAVIGATION) && (
        <TargetButton
          userCoords={userCoords}
          cameraRef={cameraRef}
          boundType={boundType}
          setBoundType={setBoundType}
          refreshCamera={refreshCamera}
        />
      )}
      <ToggleColorSchemeButton containerStyle={{ right: 4, bottom: 120 }} />
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
