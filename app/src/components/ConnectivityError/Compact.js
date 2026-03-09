import { View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";

import { createStyles } from "~/theme";

export default function ConnectivityErrorCompact({
  retryConnect,
  containerProps = {},
}) {
  const styles = useStyles();
  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      <MaterialCommunityIcons style={styles.icon} name="connection" />
      <Text style={styles.label}>Connexion perdue</Text>
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.button}
        onPress={retryConnect}
      >
        <Text style={styles.buttonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  container: {
    // flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    paddingBottom: 0,
    color: colors.primary,
    fontSize: 24,
  },
  label: {
    textAlign: "center",
    fontSize: 16,
  },
  button: {
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: colors.onSurface,
    fontSize: 15,
  },
}));
