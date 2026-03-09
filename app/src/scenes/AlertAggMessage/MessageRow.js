import React, { useState, useMemo } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import humanizeDistance from "~/lib/geo/humanizeDistance";
import { createStyles, fontFamily, useTheme } from "~/theme";
import IconByAlertLevel from "~/components/IconByAlertLevel";

import { useSessionState, alertActions } from "~/stores";

import useTimeDisplay from "~/hooks/useTimeDisplay";

import LinePosition from "./LinePosition";
import LineTime from "./LineTime";

export default function AlertRow({ row, isLast, isFirst, sortBy }) {
  const { colors, custom } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();
  const { userId: sessionUserId } = useSessionState(["userId"]);

  const { createdAt, alert } = row;
  const { level, userId } = alert;
  const levelColor = custom.appColors[level];

  const [opened, setOpened] = useState(false);

  const createdAtText = useTimeDisplay(createdAt);

  const { distance } = alert;
  const distanceText =
    typeof distance === "number" ? humanizeDistance(distance) : "";

  const isSent = userId === sessionUserId;

  const typeLabel = isSent ? "envoyée" : "reçue";
  const label = `${typeLabel} ${createdAtText} actuellement à ${distanceText}`;

  return (
    <View style={styles.container}>
      <Button
        accessibilityLabel={label}
        accessibilityHint="Ouvre le détail de l'alerte. Appui long pour afficher ou masquer le code."
        mode="outlined"
        style={[
          styles.button,
          isLast ? styles.buttonLast : null,
          isFirst ? styles.buttonFirst : null,
        ]}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        onPress={() => {
          alertActions.setNavAlertCur({ alert });
          navigation.navigate({
            name: "AlertCur",
            params: {
              screen: "AlertCurTab",
              params: {
                screen: "AlertCurOverview",
              },
            },
          });
        }}
        onLongPress={() => setOpened(!opened)}
        icon={() => (
          <View style={styles.alertIconContainer}>
            <IconByAlertLevel
              level={level}
              style={[styles.alertIcon, { color: levelColor }]}
            />
          </View>
        )}
      >
        <View style={styles.buttonView}>
          <View style={styles.buttonLeftContainer}>
            {sortBy === "location" ? (
              <>
                <LinePosition distance={distance} />
                <LineTime createdAt={createdAt} isSent={isSent} />
              </>
            ) : (
              <>
                <LineTime createdAt={createdAt} isSent={isSent} />
                <LinePosition distance={distance} />
              </>
            )}
          </View>
          <View style={styles.buttonRightContainer}>
            <Ionicons
              name="ios-enter-outline"
              size={24}
              style={styles.buttonRightContainerIcon}
            />
          </View>
        </View>
      </Button>
      {opened && (
        <View style={styles.openedContainer}>
          <Text style={styles.nidText}>#{alert.code}</Text>
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {},
  openedContainer: {
    marginTop: 0,
    backgroundColor: colors.surface,
    borderColor: colors.grey,
    borderRadius: 1,
    borderWidth: 0.5,
  },
  button: {
    marginTop: 3,
    backgroundColor: colors.error,
    borderColor: colors.grey,
    borderRadius: 1,
    borderWidth: 0.5,
  },
  buttonFirst: {},
  buttonLast: {},
  buttonContent: {
    display: "flex",
  },
  buttonView: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    alignContent: "space-between",
    width: wp(70),
  },
  buttonLeftContainer: {
    display: "flex",
  },
  buttonRightContainer: {
    display: "flex",
    alignSelf: "center",
  },
  buttonLeftTopContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: wp(60),
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
  buttonTextBottom: {
    paddingTop: 5,
    fontSize: 13,
  },
  buttonLabel: {
    color: colors.surface,
    fontFamily,
    fontSize: 13,
    textTransform: "none",
    textAlign: "left",
    color: colors.surfaceSecondary,
    paddingTop: 0,
  },
  alertIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 6,
  },
  alertIcon: {
    fontSize: 22,
  },
  nidText: {
    fontWeight: "bold",
    paddingHorizontal: 5,
    fontSize: 16,
    color: colors.surfaceSecondary,
  },
  buttonRightContainerIcon: {
    color: colors.primary,
  },
}));
