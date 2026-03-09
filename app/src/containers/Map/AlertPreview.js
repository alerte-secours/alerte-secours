import React from "react";
import { View } from "react-native";

import { useTheme, createStyles } from "~/theme";

import IconByAlertLevel from "~/components/IconByAlertLevel";
import { useSessionState } from "~/stores";

import LinePosition from "./LinePosition";
import LineTime from "./LineTime";

const useStyles = createStyles(({ theme: { colors } }) => ({
  alertPreviewContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
  },
  rightLines: {
    flexDirection: "column",
  },
  alertPreviewText: {},
}));

export default function AlertPreview({ feature }) {
  const { properties } = feature;
  const { alert } = properties;
  const { createdAt } = alert;

  const { distance } = alert;

  const { userId } = alert;
  const { userId: sessionUserId } = useSessionState(["userId"]);
  const isSent = userId === sessionUserId;

  const { level } = alert;
  const { colors, custom } = useTheme();
  const levelColor = custom.appColors[level];

  const styles = useStyles();

  return (
    <View style={styles.alertPreviewContainer}>
      <IconByAlertLevel
        level={level}
        style={[styles.alertIcon, { color: levelColor }]}
      />
      <View style={styles.rightLines}>
        <LineTime createdAt={createdAt} isSent={isSent} />
        <LinePosition distance={distance} />
      </View>
    </View>
  );
}
