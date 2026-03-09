import React from "react";
import { View } from "react-native";
import { Entypo } from "@expo/vector-icons";

import { createStyles } from "~/theme";
import Text from "~/components/Text";
import useTimeDisplay from "~/hooks/useTimeDisplay";

export default function LineTime({ createdAt, closedAt, isSent }) {
  const styles = useStyles();

  const createdAtText = useTimeDisplay(createdAt);
  const typeLabel = isSent ? "envoyée" : "reçue";
  const closedAtText = useTimeDisplay(closedAt);

  const config = closedAt
    ? {
        icon: "circle-with-cross",
        label: "terminée",
        time: closedAtText,
      }
    : {
        icon: isSent ? "arrow-long-up" : "arrow-long-down",
        label: typeLabel,
        time: createdAtText,
      };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Entypo name={config.icon} size={14} style={styles.icon} />
        <Text
          style={[
            styles.buttonText,
            styles.buttonTextTop,
            styles.buttonTextLeft,
          ]}
        >
          {config.label}
        </Text>
      </View>
      <Text
        style={[
          styles.buttonText,
          styles.buttonTextTop,
          styles.buttonTextRight,
        ]}
      >
        {config.time}
      </Text>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    padding: 0,
    height: "100%",
  },
  buttonTextTop: {
    fontSize: 15,
    display: "flex",
  },
  buttonTextLeft: {
    fontSize: 15,
    display: "flex",
  },
  buttonTextRight: {
    fontSize: 15,
    display: "flex",
    fontWeight: "bold",
  },
  icon: {
    color: colors.primary,
    paddingRight: 5,
  },
}));
