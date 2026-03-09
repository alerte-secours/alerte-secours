import { View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import Text from "~/components/Text";

import { createStyles } from "~/theme";
export default function ConnectivityErrorExpanded({
  retryConnect,
  containerProps = {},
}) {
  const styles = useStyles();
  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      <MaterialCommunityIcons style={styles.icon} name="connection" />
      <Text style={styles.label}>Vous n'êtes pas connecté à internet</Text>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    paddingBottom: 15,
    fontSize: 48,
    color: colors.primary,
  },
  label: {
    textAlign: "center",
    fontSize: 15,
  },
  button: {
    marginTop: 20,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: colors.onSurface,
    fontSize: 15,
  },
}));
