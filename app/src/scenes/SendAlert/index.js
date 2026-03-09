import React, { useState, useCallback, useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, IconButton, Title } from "react-native-paper";
import capitalize from "lodash.capitalize";

import IconByAlertLevel from "~/components/IconByAlertLevel";
import levelLabel from "~/misc/levelLabel";
import levelDesc from "~/misc/levelDesc";
import { createStyles, fontFamily } from "~/theme";
import HelpBlock from "./HelpBlock";
import RegisterRelativesButton from "./RegisterRelativesButton";
import NotificationsButton from "./NotificationsButton";
import ContributeButton from "./ContributeButton";
import RadarButton from "./RadarButton";
import RadarModal from "./RadarModal";
import TopButtonsBar from "./TopButtonsBar";
import useRadarData from "~/hooks/useRadarData";
import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";

export default function SendAlert() {
  const navigation = useNavigation();

  const styles = useStyles();

  const [helpVisible, setHelpVisible] = useState(false);
  const [radarModalVisible, setRadarModalVisible] = useState(false);

  const radarButtonRef = useRef(null);
  const radarAnnouncementsRef = useRef({ loading: false, resultKey: null });

  const {
    data: radarData,
    isLoading: radarIsLoading,
    error: radarError,
    fetchRadarData,
    reset: resetRadarData,
    hasLocation,
  } = useRadarData();

  const toggleHelp = useCallback(() => {
    setHelpVisible((prev) => {
      const next = !prev;
      announceForA11yIfScreenReaderEnabled(
        next ? "Aide affichée." : "Aide masquée.",
      );
      return next;
    });
  }, []);

  const handleRadarPress = useCallback(() => {
    if (!hasLocation) {
      // Could show a location permission alert here
      return;
    }
    setRadarModalVisible(true);
    fetchRadarData();
  }, [hasLocation, fetchRadarData]);

  const handleRadarModalClose = useCallback(() => {
    setRadarModalVisible(false);
    resetRadarData();
    setA11yFocusAfterInteractions(radarButtonRef);
  }, [resetRadarData]);

  useEffect(() => {
    if (!radarModalVisible) {
      radarAnnouncementsRef.current = { loading: false, resultKey: null };
      return;
    }

    const state = radarAnnouncementsRef.current;

    if (radarIsLoading && !state.loading) {
      state.loading = true;
      state.resultKey = null;
      announceForA11yIfScreenReaderEnabled("Recherche en cours.");
      return;
    }

    if (radarIsLoading) return;

    state.loading = false;

    if (radarError && state.resultKey !== "error") {
      state.resultKey = "error";
      announceForA11yIfScreenReaderEnabled("Erreur lors de la recherche.");
      return;
    }

    const count = radarData?.count;
    if (typeof count === "number") {
      const key = `success:${count}`;
      if (state.resultKey !== key) {
        state.resultKey = key;
        let message = `${count} utilisateurs disponibles à proximité.`;
        if (count === 0) message = "Aucun utilisateur disponible à proximité.";
        if (count === 1) message = "1 utilisateur disponible à proximité.";
        announceForA11yIfScreenReaderEnabled(message);
      }
    }
  }, [radarModalVisible, radarIsLoading, radarError, radarData?.count]);

  const navigateTo = useCallback(
    (navOpts) =>
      navigation.dispatch({
        ...CommonActions.navigate(navOpts),
      }),
    [navigation],
  );

  const sendAlert = useCallback(
    function sendAlert(level) {
      switch (level) {
        case "red":
        case "yellow":
        case "green":
          navigateTo({
            name: "SendAlertConfirm",
            params: {
              alert: {
                level,
              },
            },
          });
          break;
        case "call":
          navigateTo({
            name: "SendAlertConfirm",
            params: {
              level: "red",
              confirmed: true,
              forceCallEmergency: true,
            },
          });
          break;
        case "unkown":
          navigateTo({
            name: "SendAlertFinder",
          });
          break;
      }
    },
    [navigateTo],
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        <TopButtonsBar>
          <NotificationsButton flex={0.78} />
          <RadarButton
            ref={radarButtonRef}
            onPress={handleRadarPress}
            isLoading={radarIsLoading}
            isExpanded={radarModalVisible}
            flex={0.22}
          />
        </TopButtonsBar>

        <View style={styles.head}>
          <Title style={styles.title} accessibilityRole="header">
            Quelle est votre situation ?
          </Title>
          <IconButton
            accessibilityRole="button"
            accessibilityLabel="Aide"
            accessibilityHint={
              helpVisible
                ? "Masque les explications."
                : "Affiche des explications pour choisir votre situation."
            }
            accessibilityState={{
              expanded: helpVisible,
              selected: helpVisible,
            }}
            style={[styles.helpBtn]}
            onPress={toggleHelp}
            size={styles.helpBtn.fontSize}
            icon={({ style, ...props }) => (
              <MaterialCommunityIcons
                name="help-circle"
                style={[
                  style,
                  styles.helpBtnIcon,
                  helpVisible && styles.helpBtnIconEnabled,
                ]}
                {...props}
              />
            )}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            testID="send-alert-cta-red"
            accessibilityLabel={levelLabel.red}
            accessibilityHint="Ouvre la confirmation pour envoyer une alerte rouge."
            accessibilityRole="button"
            mode="contained"
            style={[styles.button, styles.btnRed]}
            contentStyle={[styles.buttonContent]}
            labelStyle={[styles.buttonLabel]}
            onPress={() => sendAlert("red")}
            icon={({ size }) => (
              <View style={styles.iconContainer}>
                <IconByAlertLevel
                  level="red"
                  style={[styles.alertIcon]}
                  size={size}
                />
              </View>
            )}
          >
            {capitalize(levelLabel.red)}
          </Button>
          {helpVisible && (
            <HelpBlock
              style={[styles.helpBlock, styles.helpBlockRed]}
              labelStyle={styles.helpBlockLabel}
            >
              {levelDesc.red}
            </HelpBlock>
          )}

          <Button
            testID="send-alert-cta-yellow"
            accessibilityLabel={levelLabel.yellow}
            accessibilityHint="Ouvre la confirmation pour envoyer une alerte jaune."
            accessibilityRole="button"
            mode="contained"
            style={[styles.button, styles.btnYellow]}
            contentStyle={[styles.buttonContent]}
            labelStyle={[styles.buttonLabel]}
            onPress={() => sendAlert("yellow")}
            icon={({ size }) => (
              <View style={styles.iconContainer}>
                <IconByAlertLevel
                  level="yellow"
                  style={[styles.alertIcon]}
                  size={size}
                />
              </View>
            )}
          >
            {capitalize(levelLabel.yellow)}
          </Button>
          {helpVisible && (
            <HelpBlock
              style={[styles.helpBlock, styles.helpBlockYellow]}
              labelStyle={styles.helpBlockLabel}
            >
              {levelDesc.yellow}
            </HelpBlock>
          )}

          <Button
            testID="send-alert-cta-green"
            accessibilityLabel={levelLabel.green}
            accessibilityHint="Ouvre la confirmation pour envoyer une alerte verte."
            accessibilityRole="button"
            mode="contained"
            style={[styles.button, styles.btnGreen]}
            contentStyle={[styles.buttonContent]}
            labelStyle={[styles.buttonLabel]}
            onPress={() => sendAlert("green")}
            icon={({ size }) => (
              <View style={styles.iconContainer}>
                <IconByAlertLevel
                  level="green"
                  style={[styles.alertIcon]}
                  size={size}
                />
              </View>
            )}
          >
            {capitalize(levelLabel.green)}
          </Button>
          {helpVisible && (
            <HelpBlock
              style={[styles.helpBlock, styles.helpBlockGreen]}
              labelStyle={styles.helpBlockLabel}
            >
              {levelDesc.green}
            </HelpBlock>
          )}

          <Button
            testID="send-alert-cta-unknown"
            accessibilityRole="button"
            accessibilityLabel={levelLabel.unkown}
            accessibilityHint="Ouvre l'assistant pour choisir votre situation."
            mode="contained"
            style={[styles.button, styles.btnUnkown]}
            contentStyle={[styles.buttonContent]}
            labelStyle={[styles.buttonLabel]}
            onPress={() => sendAlert("unkown")}
            icon={({ size }) => (
              <View style={styles.iconContainer}>
                <IconByAlertLevel
                  level="unknown"
                  style={[styles.alertIcon]}
                  size={size}
                />
              </View>
            )}
          >
            {capitalize(levelLabel.unkown)}
          </Button>

          <Button
            testID="send-alert-cta-call"
            accessibilityRole="button"
            accessibilityLabel={levelLabel.call}
            accessibilityHint="Ouvre la confirmation pour appeler les secours."
            mode="contained"
            style={[styles.button, styles.btnCall]}
            contentStyle={[styles.buttonContent]}
            labelStyle={[styles.buttonLabel]}
            onPress={() => sendAlert("call")}
            icon={({ size }) => (
              <View style={styles.iconContainer}>
                <IconByAlertLevel
                  level="call"
                  style={[styles.alertIcon]}
                  size={size}
                />
              </View>
            )}
          >
            {capitalize(levelLabel.call)}
          </Button>
        </View>

        <ContributeButton />

        <RadarModal
          visible={radarModalVisible}
          onDismiss={handleRadarModalClose}
          peopleCount={radarData?.count}
          isLoading={radarIsLoading}
          error={radarError}
        />
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles(
  ({ wp, hp, scaleText, theme: { colors, custom } }) => ({
    container: {
      flex: 1,
      paddingTop: hp(2),
      paddingBottom: hp(2),
      marginHorizontal: wp(7),
    },

    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      ...scaleText({ fontSize: 18 }),
      fontFamily,
      flex: 14,
    },
    helpBtn: {
      ...scaleText({ fontSize: 16 }),
    },
    helpBtnIcon: {},

    buttonsContainer: {
      flex: 1,
      flexDirection: "column",
    },
    button: {
      marginTop: hp(1),
      height: hp(10),
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      height: "100%",
    },
    buttonLabel: {
      color: custom.appColors.onColor,
      fontFamily,
      ...scaleText({ fontSize: 19 }),
      textTransform: "none",
      flex: 1,
      paddingHorizontal: wp(2.5),
      textAlign: "left",
      textShadowColor: "#545454",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },

    iconContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginLeft: wp(2),
      marginRight: wp(2),
      height: "100%",
    },
    alertIcon: {
      color: custom.appColors.onColor,
      ...scaleText({ fontSize: 26 }),
      textShadowColor: "#545454",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },

    btnRed: {
      backgroundColor: custom.appColors.red,
    },
    btnYellow: {
      backgroundColor: custom.appColors.yellow,
    },
    btnGreen: {
      backgroundColor: custom.appColors.green,
    },
    btnUnkown: {
      backgroundColor: custom.appColors.unknown,
    },
    btnCall: {
      backgroundColor: custom.appColors.call,
    },

    helpBtnIconEnabled: {
      color: colors.primary,
    },
    helpBlock: {
      borderWidth: 1,
      marginTop: 2,
      borderRadius: 4,
      paddingHorizontal: wp(1),
      paddingVertical: hp(1),
    },
    helpBlockLabel: {
      ...scaleText({ fontSize: 15 }),
    },
    helpBlockRed: {
      borderColor: custom.appColors.red,
    },
    helpBlockYellow: {
      borderColor: custom.appColors.yellow,
    },
    helpBlockGreen: {
      borderColor: custom.appColors.green,
    },
  }),
);
