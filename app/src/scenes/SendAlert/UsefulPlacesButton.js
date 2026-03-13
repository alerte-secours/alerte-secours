import React, { forwardRef, useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { createStyles } from "~/theme";

const UsefulPlacesButton = forwardRef(function UsefulPlacesButton(
  { flex = 0.22 },
  ref,
) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const styles = useStyles();

  const handlePress = useCallback(() => {
    navigation.navigate("UsefulPlacesList", {
      initialTab: "carte",
    });
  }, [navigation]);

  return (
    <View ref={ref} style={{ flex }}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={t("usefulPlaces")}
        accessibilityHint={t("usefulPlacesButtonHint")}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons
          name="map-marker-radius"
          size={24}
          color={styles.icon.color}
        />
      </TouchableOpacity>
    </View>
  );
});

export default UsefulPlacesButton;

const useStyles = createStyles(({ theme: { colors } }) => ({
  button: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 48,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    color: colors.onPrimary,
  },
}));
