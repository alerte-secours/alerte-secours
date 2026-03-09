import { View } from "react-native";
import MapLinksPopup from "~/containers/MapLinksPopup";
import MapLinksPopupInlineButton from "~/containers/MapLinksPopup/InlineButton";

import useStyles from "./styles";
import { useState } from "react";

export default function MapLinksButton({ coordinates }) {
  const styles = useStyles();
  const [externalGeoIsVisible, setExternalGeoIsVisible] = useState(false);
  return (
    <>
      <View style={[styles.actionContainer, styles.actionMapLink]}>
        <MapLinksPopupInlineButton
          setIsVisible={setExternalGeoIsVisible}
          coordinates={coordinates}
        />
      </View>
      <MapLinksPopup
        isVisible={externalGeoIsVisible}
        setIsVisible={setExternalGeoIsVisible}
        options={{
          longitude: coordinates[0],
          latitude: coordinates[1],
        }}
      />
    </>
  );
}
