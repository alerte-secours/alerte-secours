import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "~/theme";
import Text from "~/components/Text";
import { MaterialIcons } from "@expo/vector-icons";

export default function ContributeButton() {
  const navigation = useNavigation();
  const styles = useStyles();

  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Contribuer au projet"
        accessibilityHint="Ouvre l'écran pour contribuer au projet."
        style={styles.button}
        onPress={() => navigation.navigate("Contribute")}
      >
        <MaterialIcons
          name="favorite"
          size={24}
          color={styles.icon.color}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Contribuer au projet</Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  icon: {
    color: colors.primary,
    marginRight: 10,
  },
}));
