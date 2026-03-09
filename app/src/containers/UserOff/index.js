import React from "react";
import { View } from "react-native";
import { Button, TouchableRipple } from "react-native-paper";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";

import { authActions } from "~/stores";

export default function UserOff({ containerProps = {} }) {
  const styles = useStyles();
  const connect = () => {
    authActions.userOnMode();
  };
  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      <TouchableRipple onPress={connect}>
        <MaterialCommunityIcons style={styles.icon} name="power" size={48} />
      </TouchableRipple>
      <Button style={styles.label} onPress={connect} mode="contained">
        CONNECTER
      </Button>
    </View>
  );
}

const useStyles = createStyles(({ fontSize, wp, theme: { colors } }) => ({
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
    backgroundColor: colors.primary,
  },
}));
