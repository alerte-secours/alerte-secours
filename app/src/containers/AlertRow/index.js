import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View } from "react-native";
import { IconButton, TouchableRipple } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";

import humanizeDistance from "~/lib/geo/humanizeDistance";
import { createStyles, fontFamily, useTheme } from "~/theme";
import IconByAlertLevel from "~/components/IconByAlertLevel";
import Text from "~/components/Text";
import { useSessionState, alertActions } from "~/stores";

import LinePosition from "./LinePosition";
import LineTime from "./LineTime";

import useTimeDisplay from "~/hooks/useTimeDisplay";

import getContactName from "~/lib/contacts/get-contact-name";
import { normalizeNumber } from "~/utils/phone";

import AlertInfoLineSubject from "~/containers/AlertInfoLines/Subject";
import AlertInfoLineAddress from "~/containers/AlertInfoLines/Address";
import AlertInfoLineNear from "~/containers/AlertInfoLines/Near";
import AlertInfoLineW3w from "~/containers/AlertInfoLines/W3w";
import AlertInfoLineRadius from "~/containers/AlertInfoLines/Radius";
import AlertInfoLineSentBy from "~/containers/AlertInfoLines/SentBy";
import AlertInfoLineNotifiedCount from "~/containers/AlertInfoLines/NotifiedCount";

import useDeviceCountryCode from "~/hooks/useDeviceCountryCode";
import { createLogger } from "~/lib/logger";
import { UI_SCOPES, FEATURE_SCOPES } from "~/lib/logger/scopes";

const alertRowLogger = createLogger({
  module: UI_SCOPES.COMPONENTS,
  feature: FEATURE_SCOPES.ALERTS,
});

const getHeadText = ({ isSent, isRelative, state }) => {
  const isOpen = state === "open";
  if (isSent) {
    return "Votre demande d'aide";
  }
  if (isRelative) {
    if (isOpen) {
      return `Un de vos proches a besoin d'aide`;
    }
    return `Un de vos proches a eu besoin d'aide`;
  }
  return `Demande d'aide à proximité`;
};

export default function AlertRow({ row, isLast, isFirst, sortBy }) {
  const { colors, custom } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();
  const { userId: sessionUserId } = useSessionState(["userId"]);

  const { createdAt, alert } = row;
  const { level, userId, state } = alert;
  const levelColor = state === "open" ? custom.appColors[level] : colors.grey;

  const [opened, setOpened] = useState(false);

  const createdAtText = useTimeDisplay(createdAt);

  const { distance } = alert;
  const distanceText =
    typeof distance === "number" ? humanizeDistance(distance) : "";

  const isSent = userId === sessionUserId;

  const typeLabel = isSent ? "envoyée" : "reçue";
  const label = `${typeLabel} ${createdAtText} actuellement à ${distanceText}`;

  const goToAlert = useCallback(() => {
    alertActions.setNavAlertCur({ alert });
    navigation.dispatch(
      CommonActions.navigate({
        name: "AlertCur",
        params: {
          screen: "AlertCurTab",
          params: {
            screen: "AlertCurOverview",
          },
        },
      }),
    );
  }, [alert, navigation]);

  const { reason } = row;
  const isRelative = reason === "relative";

  const [relativeNameLabel, setRelativeNameLabel] = useState(
    `~${alert.username}`,
  );
  const defaultCountryCode = useDeviceCountryCode();
  const lookupsRelativeNameLabel = useCallback(async () => {
    if (!isRelative) {
      return;
    }
    const { relative, relativePhoneCountry } = row;
    let relativeLabel;
    if (relative) {
      try {
        const fullName = await getContactName(relative, relativePhoneCountry, {
          defaultCountryCode,
        });
        relativeLabel = fullName;
      } catch (error) {
        // alertRowLogger.error("Failed to get contact name", {
        //   error: error.message,
        //   stack: error.stack
        // });
      }
      if (!relativeLabel) {
        const normalizedPhoneNumber = normalizeNumber(
          relative,
          relativePhoneCountry,
          {
            defaultCountryCode,
          },
        );
        relativeLabel = normalizedPhoneNumber;
      }
    }
    if (relativeLabel) {
      setRelativeNameLabel(relativeLabel);
    }
  }, [isRelative, row, defaultCountryCode]);

  useEffect(() => {
    lookupsRelativeNameLabel();
  }, [lookupsRelativeNameLabel]);

  const headText = getHeadText({
    isSent,
    isRelative,
    state,
  });

  const isOpen = state === "open";

  return (
    <View style={styles.container}>
      <TouchableRipple
        accessibilityLabel={label}
        accessibilityHint="Ouvre l'alerte. Appui long pour afficher ou masquer les informations."
        mode="outlined"
        style={[
          styles.button,
          isLast ? styles.buttonLast : null,
          isFirst ? styles.buttonFirst : null,
          isRelative ? styles.relativeButton : null,
          !isOpen
            ? {
                backgroundColor: colors.surfaceVariant,
              }
            : null,
        ]}
        contentStyle={styles.buttonContent}
        onPress={goToAlert}
        onLongPress={() => setOpened(!opened)}
      >
        <View style={styles.buttonContainer}>
          <View style={styles.relativeContainer}>
            <MaterialCommunityIcons
              name={
                isSent
                  ? "arrow-up-bold-circle"
                  : isRelative
                  ? "star"
                  : "account"
              }
              size={24}
              color={colors.onSurface}
            />
            <Text style={styles.headText}>{headText}</Text>
            <View style={styles.relativeNameLabel}>
              <Text style={styles.relativeNameLabelText}>
                {relativeNameLabel}
              </Text>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <IconByAlertLevel
              level={level}
              style={[styles.alertIcon, { color: levelColor }]}
            />
            <Text style={styles.codeText}>#{alert.code}</Text>
            <View></View>
          </View>
          <View style={styles.buttonHorizontalContainer}>
            <View>
              <IconButton
                onPress={() => setOpened(!opened)}
                icon={() => (
                  <MaterialCommunityIcons
                    name={opened ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={colors.onSurface}
                  />
                )}
              />
            </View>
            <View style={styles.proximitySpaceTimeInfos}>
              {sortBy === "location" ? (
                <>
                  <LinePosition distance={distance} />
                  <LineTime
                    createdAt={createdAt}
                    closedAt={alert.closedAt}
                    isSent={isSent}
                  />
                </>
              ) : (
                <>
                  <LineTime
                    createdAt={createdAt}
                    closedAt={alert.closedAt}
                    isSent={isSent}
                  />
                  <LinePosition distance={distance} />
                </>
              )}
            </View>
            <View style={styles.rightIcon}>
              <IconButton
                onPress={goToAlert}
                icon={() => (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={colors.onSurface}
                  />
                )}
              />
            </View>
          </View>
        </View>
      </TouchableRipple>
      {opened && (
        <View style={styles.details}>
          <View style={styles.detailsTitle}>
            <MaterialCommunityIcons
              name="information-variant"
              size={24}
              color={colors.primary}
              style={styles.Icon}
            />
            <Text style={styles.detailsTitleText}>
              Informations sur l'alerte
            </Text>
          </View>

          <AlertInfoLineSubject alert={alert} isFirst />
          <AlertInfoLineAddress alert={alert} />
          <AlertInfoLineNear alert={alert} />
          <AlertInfoLineW3w alert={alert} />
          <AlertInfoLineNotifiedCount alert={alert} />
          <AlertInfoLineRadius alert={alert} />
          <AlertInfoLineSentBy alert={alert} />
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {},
  details: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 0.5,
    borderRadius: 1,
    padding: 5,
  },
  detailsTitle: {
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsTitleText: {
    fontSize: 17,
    textAlign: "center",
    color: colors.onSurface,
  },
  button: {
    display: "flex",
    marginTop: 5,
    minHeight: 60,
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: 1,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
  },
  buttonHorizontalContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonFirst: {},
  buttonLast: {},
  alertIcon: {
    fontSize: 28,
  },
  titleContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: colors.outline,
    borderBottomWidth: 0.5,
    paddingBottom: 5,
    marginBottom: 5,
  },
  codeText: {
    textAlign: "center",
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  rightIcon: {
    justifyContent: "center",
  },
  relativeButton: {},
  relativeContainer: {
    borderBottomColor: colors.outline,
    borderBottomWidth: 0.5,
    padding: 5,
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
  },
  headText: {
    flex: 1,
    textAlign: "center",
    minWidth: 120,
    maxWidth: 140,
    color: colors.onSurface,
  },
  relativeNameLabel: {
    paddingLeft: 15,
    flexGrow: 1,
    flexShrink: 1,
  },
  relativeNameLabelText: {
    textAlign: "center",
    flexShrink: 1,
    color: colors.onSurface,
  },
  proximitySpaceTimeInfos: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
}));
