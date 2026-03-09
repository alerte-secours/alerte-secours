import React, { useCallback, useState, useMemo } from "react";
import { View, ImageBackground, ScrollView } from "react-native";
import { TouchableRipple, Button, Title } from "react-native-paper";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { deepEqual } from "fast-equals";

import withConnectivity from "~/hoc/withConnectivity";
import { useToast } from "~/lib/toast-notifications";

import {
  useAlertState,
  useSessionState,
  alertActions,
  useAggregatedMessagesState,
  useDefibsState,
  defibsActions,
} from "~/stores";
import { getCurrentLocation } from "~/location";
import { getStoredLocation } from "~/location/storage";

import alertBigButtonBgMap from "~/assets/img/alert-big-button-bg-map.png";
import alertBigButtonBgMapGrey from "~/assets/img/alert-big-button-bg-map-grey.png";
import alertBigButtonBgMessages from "~/assets/img/alert-big-button-bg-messages.png";
import alertBigButtonBgMessagesGrey from "~/assets/img/alert-big-button-bg-messages-grey.png";

import Text from "~/components/Text";
import AlertInfoLineLevel from "~/containers/AlertInfoLines/Level";
import LocationInfoSection from "~/containers/LocationInfoSection";
import AlertInfoLineCode from "~/containers/AlertInfoLines/Code";
import AlertInfoLineDistance from "~/containers/AlertInfoLines/Distance";
import AlertInfoLineCreatedTime from "~/containers/AlertInfoLines/CreatedTime";
import AlertInfoLineClosedTime from "~/containers/AlertInfoLines/ClosedTime";
import AlertInfoLineSubject from "~/containers/AlertInfoLines/Subject";
import AlertInfoLineAddress from "~/containers/AlertInfoLines/Address";
import AlertInfoLineNear from "~/containers/AlertInfoLines/Near";
import AlertInfoLineW3w from "~/containers/AlertInfoLines/W3w";
import AlertInfoLineNotifiedCount from "~/containers/AlertInfoLines/NotifiedCount";
import AlertInfoLineRadius from "~/containers/AlertInfoLines/Radius";
import AlertInfoLineSentBy from "~/containers/AlertInfoLines/SentBy";

import {
  COMING_HELP_MUTATION,
  NOTIFY_AROUND_MUTATION,
  NOTIFY_RELATIVES_MUTATION,
  CLOSE_ALERT,
  REOPEN_ALERT,
  KEEP_OPEN_ALERT,
} from "./gql";

import useStyles from "./styles";
import SendSms from "./SendSms";
import PhoneCallEmergency from "./PhoneCallEmergency";

import { useMutation } from "@apollo/client";

import FieldLevel from "./FieldLevel";
import FieldSubject from "./FieldSubject";
import FieldFollowLocation from "./FieldFollowLocation";
import MapLinksButton from "~/containers/MapLinksButton";
import { useTheme } from "~/theme";

const COMING_HELP_MESSAGE = "Je viens vous aider";

export default withConnectivity(
  React.memo(function AlertCurOverview() {
    const styles = useStyles();
    const { colors } = useTheme();
    const { navAlertCur } = useAlertState(["navAlertCur"]);
    const { alert } = navAlertCur;
    // const isFocused = useIsFocused();
    // console.debug("Render AlertCurOverwiew", new Date(), { isFocused, alertId });

    const { messagesList } = useAggregatedMessagesState(["messagesList"]);
    const unreadMessagesForCurrentAlert =
      alert &&
      alert.id &&
      messagesList.filter((msg) => !msg.isRead && msg.alertId === alert.id)
        .length;

    const { id: alertId, userId } = alert;
    const { userId: sessionUserId } = useSessionState(["userId"]);
    const isSent = userId === sessionUserId;

    const navigation = useNavigation();
    const toast = useToast();

    const { showDefibsOnAlertMap: defibsEnabled } = useDefibsState([
      "showDefibsOnAlertMap",
    ]);
    const [loadingDaeCorridor, setLoadingDaeCorridor] = useState(false);

    const toggleDefibsOnAlertMap = useCallback(async () => {
      if (defibsEnabled) {
        defibsActions.setShowDefibsOnAlertMap(false);
        return;
      }

      if (loadingDaeCorridor) {
        return;
      }
      setLoadingDaeCorridor(true);
      try {
        const alertLonLat = alert?.location?.coordinates;
        const hasAlertLonLat =
          Array.isArray(alertLonLat) &&
          alertLonLat.length === 2 &&
          alertLonLat[0] !== null &&
          alertLonLat[1] !== null;

        if (!hasAlertLonLat) {
          toast.show("Position de l'alerte indisponible", {
            placement: "top",
            duration: 4000,
            hideOnPress: true,
          });
          return;
        }

        // 1) Current coords if possible
        let coords = await getCurrentLocation();

        // 2) Fallback to last-known coords if needed
        const hasCoords =
          coords && coords.latitude !== null && coords.longitude !== null;
        if (!hasCoords) {
          const lastKnown = await getStoredLocation();
          coords = lastKnown?.coords || coords;
        }

        const hasFinalCoords =
          coords && coords.latitude !== null && coords.longitude !== null;
        if (!hasFinalCoords) {
          toast.show(
            "Localisation indisponible : activez la géolocalisation pour afficher les défibrillateurs.",
            {
              placement: "top",
              duration: 6000,
              hideOnPress: true,
            },
          );
          return;
        }

        const userLonLat = [coords.longitude, coords.latitude];

        const { error } = await defibsActions.loadCorridor({
          userLonLat,
          alertLonLat,
        });

        if (error) {
          defibsActions.setShowDefibsOnAlertMap(false);
          toast.show(
            "Impossible de charger les défibrillateurs (base hors-ligne indisponible).",
            {
              placement: "top",
              duration: 6000,
              hideOnPress: true,
            },
          );
          return;
        }

        defibsActions.setShowDefibsOnAlertMap(true);

        navigation.navigate("Main", {
          screen: "AlertCur",
          params: {
            screen: "AlertCurTab",
            params: {
              screen: "AlertCurMap",
            },
          },
        });
      } catch (error) {
        defibsActions.setShowDefibsOnAlertMap(false);
        toast.show("Erreur lors du chargement des défibrillateurs", {
          placement: "top",
          duration: 6000,
          hideOnPress: true,
        });
      } finally {
        setLoadingDaeCorridor(false);
      }
    }, [alert, defibsEnabled, loadingDaeCorridor, navigation, toast]);

    const [notifyAroundMutation] = useMutation(NOTIFY_AROUND_MUTATION);
    const notifyAround = useCallback(async () => {
      await notifyAroundMutation({
        variables: {
          alertId,
        },
      });
    }, [alertId, notifyAroundMutation]);

    const [notifyRelativesMutation] = useMutation(NOTIFY_RELATIVES_MUTATION);
    const notifyRelatives = useCallback(async () => {
      await notifyRelativesMutation({
        variables: {
          alertId,
        },
      });
    }, [alertId, notifyRelativesMutation]);

    const [closeAlertMutation] = useMutation(CLOSE_ALERT);
    const closeAlert = useCallback(async () => {
      await closeAlertMutation({
        variables: { alertId },
        optimisticResponse: {
          doAlertClose: {
            ok: true,
            __typename: "AlertCloseOutput",
          },
        },
        update: (cache) => {
          // Find the alert in the cache and update its state
          cache.modify({
            id: cache.identify({ __typename: "alert", id: alertId }),
            fields: {
              state: () => "closed",
              closedAt: () => new Date().toISOString(),
            },
          });
        },
      });
    }, [alertId, closeAlertMutation]);

    const [reopenAlertMutation] = useMutation(REOPEN_ALERT);
    const reopenAlert = useCallback(async () => {
      await reopenAlertMutation({
        variables: { alertId },
      });
    }, [alertId, reopenAlertMutation]);

    const [keepOpenAlertMutation] = useMutation(KEEP_OPEN_ALERT);
    const keepOpenAlert = useCallback(async () => {
      await keepOpenAlertMutation({
        variables: { alertId },
      });
    }, [alertId, keepOpenAlertMutation]);

    const shouldDisplayKeepOpen = useCallback(() => {
      const createdAt = new Date(alert.createdAt);
      const now = new Date();
      const diff = now - createdAt;
      const hours = diff / (1000 * 60 * 60);

      // Check if alert is older than 23 hours
      if (hours < 23) {
        return false;
      }

      // Check if keep_open_at is null or less than 1 hour from now
      if (!alert.keepOpenAt) {
        return true;
      }

      const keepOpenAt = new Date(alert.keepOpenAt);
      const diffFromKeepOpen = keepOpenAt - now; // Future - now to get time until keepOpenAt
      const hoursUntilKeepOpen = diffFromKeepOpen / (1000 * 60 * 60);

      return hoursUntilKeepOpen <= 1; // Show button if less than 1 hour until keepOpenAt
    }, [alert.createdAt, alert.keepOpenAt]);

    const [comingHelpMutation] = useMutation(COMING_HELP_MUTATION);
    const comingHelp = useCallback(async () => {
      const coords = await getCurrentLocation();
      const { latitude, longitude } = coords;
      const location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
      await comingHelpMutation({
        variables: {
          id: navAlertCur.id,
          alertId: alert.id,
          text: COMING_HELP_MESSAGE,
          location,
        },
      });
      navigation.navigate({
        name: "AlertCur",
        params: {
          screen: "AlertCurTab",
          params: {
            screen: "AlertCurMessage",
          },
        },
      });
    }, [comingHelpMutation, alert.id, navAlertCur.id, navigation]);

    const quitAlert = useCallback(() => {
      alertActions.setNavAlertCur(null);
      navigation.navigate("AlertAggList");
    }, [navigation]);

    const { state } = alert;
    const isOpen = state === "open";
    const isClosed = state === "closed";
    const isArchived = state === "archived";

    const { level } = alert;
    const alertLevelEmergency = level === "red" || level === "yellow";

    const [parentScrollEnabled, setParentScrollEnabled] = useState(true);

    const isLocationsDifferent = useMemo(() => {
      return (
        alert.initialLocation &&
        alert.location &&
        !deepEqual(alert.initialLocation, alert.location)
      );
    }, [alert.initialLocation, alert.location]);

    // if (!isFocused) {
    //   return null;
    // }
    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        scrollEnabled={parentScrollEnabled}
        style={styles.scrollView}
      >
        {isClosed && <Title style={styles.title}>Alerte terminée</Title>}
        {isArchived && <Title style={styles.title}>Alerte archivée</Title>}
        <View style={styles.container}>
          <View style={styles.containerNav}>
            <View style={[styles.linkBox, styles.linkToMessages]}>
              <ImageBackground
                source={
                  isOpen
                    ? alertBigButtonBgMessages
                    : alertBigButtonBgMessagesGrey
                }
                resizeMode="cover"
              >
                <TouchableRipple
                  style={styles.linkBoxButton}
                  onPress={() => {
                    navigation.navigate("Main", {
                      screen: "AlertCur",
                      params: {
                        screen: "AlertCurTab",
                        params: {
                          screen: "AlertCurMessage",
                        },
                      },
                    });
                  }}
                >
                  <View style={styles.linkBoxButtonContent}>
                    {/* <MaterialCommunityIcons
                  style={styles.linkBoxButtonIcon}
                  name="chat-processing-outline"
                  size={64}
                /> */}
                    <View
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <Text style={styles.linkBoxButtonText}>Messages</Text>
                      {unreadMessagesForCurrentAlert > 0 && (
                        <Text style={styles.messageCounterText}>
                          {` (${
                            unreadMessagesForCurrentAlert > 99
                              ? "+99"
                              : unreadMessagesForCurrentAlert
                          })`}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableRipple>
              </ImageBackground>
            </View>
            <View style={[styles.linkBox, styles.linkToMap]}>
              <ImageBackground
                source={isOpen ? alertBigButtonBgMap : alertBigButtonBgMapGrey}
                resizeMode="cover"
              >
                <TouchableRipple
                  onPress={() => {
                    navigation.navigate("Main", {
                      screen: "AlertCur",
                      params: {
                        screen: "AlertCurTab",
                        params: {
                          screen: "AlertCurMap",
                        },
                      },
                    });
                  }}
                  style={styles.linkBoxButton}
                >
                  <View style={styles.linkBoxButtonContent}>
                    {/* <MaterialCommunityIcons
                  style={styles.linkBoxButtonIcon}
                  name="map-marker-radius-outline"
                  size={64}
                /> */}
                    <Text style={styles.linkBoxButtonText}>Carte</Text>
                  </View>
                </TouchableRipple>
              </ImageBackground>
            </View>
          </View>

          <View style={styles.headContainerInfos}>
            <AlertInfoLineNotifiedCount alert={alert} noBorder={true} />
          </View>

          <View style={styles.containerActions}>
            {/* {isSent && alert.notifyRelatives && (
            <View
              key="relative-notifed"
              style={[styles.actionContainer, styles.actionRelativeNotified]}
            >
              <Text>Vos proches ont été notifiés</Text>
            </View>
          )} */}
            {isOpen && isSent && !alert.notifyRelatives && (
              <View
                key="notify-relative"
                style={[styles.actionContainer, styles.actionNotifyRelatives]}
              >
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      name="account-group"
                      style={[
                        styles.actionIcon,
                        styles.actionNotifyRelativesIcon,
                      ]}
                    />
                  )}
                  style={[
                    styles.actionButton,
                    styles.actionNotifyRelativesButton,
                  ]}
                  onPress={notifyRelatives}
                >
                  <Text
                    style={[
                      styles.actionText,
                      styles.actionNotifyRelativesText,
                    ]}
                  >
                    Prévenir mes proches via l'application
                  </Text>
                </Button>
              </View>
            )}
            {isOpen && isSent && !alert.notifyAround && (
              <View
                key="notify-around"
                style={[styles.actionContainer, styles.actionNotifyAround]}
              >
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      name="map-marker-radius"
                      style={[styles.actionIcon, styles.actionNotifyAroundIcon]}
                    />
                  )}
                  style={[styles.actionButton, styles.actionNotifyAroundButton]}
                  onPress={notifyAround}
                >
                  <Text
                    style={[styles.actionText, styles.actionNotifyAroundText]}
                  >
                    Alerter aux alentours via l'application
                  </Text>
                </Button>
              </View>
            )}
            {isOpen && !isSent && !navAlertCur.comingHelp && (
              <View
                key="coming-help"
                style={[styles.actionContainer, styles.actionComing]}
              >
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      // name="run-fast"
                      name="run"
                      // name="account-voice"
                      // name="handshake"
                      style={[styles.actionIcon, styles.actionComingHelpIcon]}
                    />
                  )}
                  style={[styles.actionButton, styles.actionComingHelpButton]}
                  onPress={comingHelp}
                >
                  <Text
                    style={[styles.actionText, styles.actionComingHelpText]}
                  >
                    Je viens vous aider
                  </Text>
                </Button>
              </View>
            )}

            {isOpen && alert.location?.coordinates && (
              <View
                key="show-defibs"
                style={[styles.actionContainer, styles.actionShowDefibs]}
              >
                <Button
                  mode="contained"
                  disabled={loadingDaeCorridor}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={
                        loadingDaeCorridor
                          ? "loading"
                          : defibsEnabled
                            ? "heart-off"
                            : "heart-pulse"
                      }
                      style={[styles.actionIcon, styles.actionShowDefibsIcon]}
                    />
                  )}
                  style={[
                    styles.actionButton,
                    defibsEnabled
                      ? styles.actionShowDefibsButtonActive
                      : styles.actionShowDefibsButton,
                  ]}
                  onPress={toggleDefibsOnAlertMap}
                >
                  <Text
                    style={[styles.actionText, styles.actionShowDefibsText]}
                  >
                    {defibsEnabled
                      ? "Ne plus afficher les défibrillateurs"
                      : "Afficher les défibrillateurs"}
                  </Text>
                </Button>
              </View>
            )}

            {!isSent && alert.location?.coordinates && (
              <MapLinksButton coordinates={alert.location.coordinates} />
            )}

            {isOpen && isSent && <SendSms />}
            {isOpen && isSent && alertLevelEmergency && <PhoneCallEmergency />}

            {isOpen && isSent && shouldDisplayKeepOpen() && (
              <View
                key="keep-open"
                style={[styles.actionContainer, styles.actionKeepOpen]}
              >
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      name="clock-outline"
                      style={[styles.actionIcon, styles.actionKeepOpenIcon]}
                    />
                  )}
                  style={[styles.actionButton, styles.actionKeepOpenButton]}
                  onPress={keepOpenAlert}
                >
                  <Text style={[styles.actionText, styles.actionKeepOpenText]}>
                    Garder l'alerte ouverte
                  </Text>
                </Button>
              </View>
            )}

            {isOpen && isSent && (
              <View
                key="close"
                style={[styles.actionContainer, styles.actionClose]}
              >
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      name="close-circle-outline"
                      style={[styles.actionIcon, styles.actionCloseIcon]}
                    />
                  )}
                  style={[styles.actionButton, styles.actionCloseButton]}
                  onPress={closeAlert}
                >
                  <Text style={[styles.actionText, styles.actionCloseText]}>
                    Terminer l'alerte
                  </Text>
                </Button>
              </View>
            )}

            {isClosed && isSent && (
              <View
                key="reopen"
                style={[styles.actionContainer, styles.actionReopen]}
              >
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      name="plus-circle-outline"
                      style={[styles.actionIcon, styles.actionReopenIcon]}
                    />
                  )}
                  style={[styles.actionButton, styles.actionReopenButton]}
                  onPress={reopenAlert}
                >
                  <Text style={[styles.actionText, styles.actionReopenText]}>
                    Rouvrir l'alerte
                  </Text>
                </Button>
              </View>
            )}

            {isSent && alert.location?.coordinates && (
              <MapLinksButton coordinates={alert.location.coordinates} />
            )}

            <View
              key="quit"
              style={[styles.actionContainer, styles.actionQuit]}
            >
              <Button
                mode="contained"
                icon={() => (
                  <MaterialCommunityIcons
                    name="exit-to-app"
                    style={[styles.actionIcon, styles.actionQuitIcon]}
                  />
                )}
                style={[styles.actionButton, styles.actionQuitButton]}
                onPress={quitAlert}
              >
                <Text style={[styles.actionText, styles.actionQuitText]}>
                  Quitter
                </Text>
              </Button>
            </View>
          </View>

          {isSent && isOpen && (
            <View style={styles.containerFields}>
              <FieldLevel alert={alert} />

              <FieldSubject
                alert={alert}
                setParentScrollEnabled={setParentScrollEnabled}
              />

              <FieldFollowLocation alert={alert} />
            </View>
          )}

          <View style={styles.containerInfos}>
            {(!isSent || !isOpen) && (
              <AlertInfoLineLevel alert={alert} isFirst />
            )}
            <AlertInfoLineCode alert={alert} />
            {!isSent && <AlertInfoLineDistance alert={alert} />}
            <AlertInfoLineCreatedTime alert={alert} />
            <AlertInfoLineClosedTime alert={alert} />
            {(!isSent || !isOpen) && <AlertInfoLineSubject alert={alert} />}

            {useMemo(() => {
              if (isLocationsDifferent) {
                return (
                  <>
                    <LocationInfoSection
                      title="Position initiale"
                      alert={alert}
                      styles={styles}
                    />
                    <LocationInfoSection
                      title={
                        alert.followLocation
                          ? "Position actuelle"
                          : "Dernière position connue"
                      }
                      alert={alert}
                      useLastLocation={true}
                      styles={styles}
                    />
                  </>
                );
              } else {
                return (
                  <>
                    <AlertInfoLineAddress alert={alert} />
                    <AlertInfoLineNear alert={alert} />
                    <AlertInfoLineW3w alert={alert} />
                  </>
                );
              }
            }, [alert, styles, isLocationsDifferent])}

            <View
              style={isLocationsDifferent ? styles.locationSeparator : null}
            >
              <AlertInfoLineRadius alert={alert} />
              <AlertInfoLineSentBy alert={alert} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }),
);
