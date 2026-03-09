import React from "react";
import { View } from "react-native";
import { Entypo } from "@expo/vector-icons";

import { createStyles } from "~/theme";
import Text from "~/components/Text";
import useTimeDisplay from "~/hooks/useTimeDisplay";

export default function LineTime({ createdAt, isSent }) {
  const styles = useStyles();

  const createdAtText = useTimeDisplay(createdAt);

  const typeLabel = isSent ? "envoyée" : "reçue";

  return (
    <View style={styles.container}>
      <Text
        style={[styles.buttonText, styles.buttonTextTop, styles.buttonTextLeft]}
      >
        {isSent ? (
          <Entypo name="arrow-long-up" size={11} style={styles.icon} />
        ) : (
          <Entypo name="arrow-long-down" size={11} style={styles.icon} />
        )}
        {typeLabel}
      </Text>
      <Text
        style={[
          styles.buttonText,
          styles.buttonTextTop,
          styles.buttonTextRight,
        ]}
      >
        {createdAtText}
      </Text>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: wp(50),
    paddingVertical: 2,
  },
  buttonText: {
    padding: 0,
  },
  buttonTextTop: {
    fontSize: 13,
    display: "flex",
  },
  buttonTextLeft: {
    fontSize: 13,
    display: "flex",
  },
  buttonTextRight: {
    fontSize: 13,
    display: "flex",
    fontWeight: "bold",
  },
  icon: {
    color: colors.primary,
  },
}));
