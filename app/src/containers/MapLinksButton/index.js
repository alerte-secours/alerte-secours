import { View } from "react-native";
import MapLinksPopup from "~/containers/MapLinksPopup";
import MapLinksPopupInlineButton from "~/containers/MapLinksPopup/InlineButton";

import { useState } from "react";
import { createStyles } from "~/theme";

export default function MapLinksButton({ coordinates }) {
  const [externalGeoIsVisible, setExternalGeoIsVisible] = useState(false);
  const styles = useStyles();
  if (!coordinates || coordinates.length !== 2) {
    return null;
  }

  return (
    <>
      <View style={[styles.actionContainer, styles.actionMapLink]}>
        <MapLinksPopupInlineButton setIsVisible={setExternalGeoIsVisible} />
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

const useStyles = createStyles(({ theme: { colors } }) => ({
  actionContainer: {
    marginBottom: 8,
  },
}));
