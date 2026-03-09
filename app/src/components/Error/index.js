import React, { useState, useRef, useCallback } from "react";

import { View, StyleSheet } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "react-native-paper";

import Text from "~/components/Text";
import { createStyles } from "~/theme";

export default function Error({ containerProps = {}, resetError }) {
  const styles = useStyles();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const isButtonPressedRef = useRef(false);

  const handlePress = useCallback(() => {
    if (isButtonPressedRef.current) {
      return;
    }
    isButtonPressedRef.current = true;
    setIsButtonDisabled(true);
    setTimeout(() => {
      resetError();
    }, 1500);
  }, [resetError]);

  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      <MaterialCommunityIcons style={styles.icon} name="ladybug" size={48} />
      <Text style={styles.label}>Une erreur inattendue est survenue</Text>
      <Button
        mode="contained"
        style={styles.button}
        onPress={handlePress}
        disabled={isButtonDisabled}
      >
        Relancer l'application
      </Button>
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
    color: colors.primary,
  },
  label: {
    textAlign: "center",
    fontSize: 15,
  },
  button: {
    marginTop: 20,
  },
}));
