import { getApps } from "react-native-map-link";
import { useState, useEffect } from "react";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Text from "~/components/Text";
import { createStyles } from "~/theme";

export default function MapLinksPopupInlineButton({
  setIsVisible,
  textProps = {},
  ...extraProps
}) {
  const [availableApps, setAvailableApps] = useState(null);
  const styles = useStyles();
  useEffect(() => {
    (async () => {
      const result = await getApps({
        alwaysIncludeGoogle: true,
      });
      setAvailableApps(result);
    })();
  }, []);

  if (!availableApps || !availableApps.length) {
    return null;
  }
  return (
    <Button
      mode="contained"
      onPress={() => setIsVisible(true)}
      icon={() => (
        <MaterialCommunityIcons
          name="arrow-top-right-bold-box-outline"
          size={24}
          style={styles.buttonIcon}
        />
      )}
      style={{ borderRadius: 8 }}
      {...extraProps}
    >
      <Text style={styles.buttonText} {...textProps}>
        Ouvrir dans {availableApps.map(({ name }) => name).join(", ")}
      </Text>
    </Button>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  buttonText: {
    fontSize: 16,
    color: colors.onPrimary,
  },
  buttonIcon: {
    color: colors.onPrimary,
  },
}));
