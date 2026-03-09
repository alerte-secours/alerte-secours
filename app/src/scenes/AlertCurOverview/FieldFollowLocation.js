import { useCallback, useEffect, useState, useRef } from "react";
import { View, AppState } from "react-native";
import { Switch, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@apollo/client";
import * as Location from "expo-location";

import { UPDATE_ALERT_FOLLOW_LOCATION_MUTATION } from "./gql";
import Text from "~/components/Text";
import { createStyles, useTheme } from "~/theme";
import { usePermissionsState, permissionsActions } from "~/stores";
import requestPermissionLocationBackground from "~/permissions/requestPermissionLocationBackground";
import requestPermissionLocationForeground from "~/permissions/requestPermissionLocationForeground";
import openSettings from "~/lib/native/openSettings";

export default function FieldFollowLocation({ alert }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id: alertId } = alert;

  const [updateAlertFollowLocationMutation] = useMutation(
    UPDATE_ALERT_FOLLOW_LOCATION_MUTATION,
  );

  const { locationForeground, locationBackground } = usePermissionsState([
    "locationForeground",
    "locationBackground",
  ]);

  const [followLocation, setFollowLocation] = useState(
    alert.followLocation || false,
  );
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const prevFollowLocation = useRef(alert.followLocation);
  useEffect(() => {
    if (prevFollowLocation.current !== alert.followLocation) {
      prevFollowLocation.current = alert.followLocation;
      setFollowLocation(alert.followLocation || false);
    }
  }, [alert.followLocation]);

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status: fgStatus } =
        await Location.getForegroundPermissionsAsync();
      const { status: bgStatus } =
        await Location.getBackgroundPermissionsAsync();

      permissionsActions.setLocationForeground(fgStatus === "granted");
      permissionsActions.setLocationBackground(bgStatus === "granted");
    } catch (error) {
      console.error("Error checking location permissions:", error);
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Listen for app state changes to refresh permissions when returning from settings
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        // App came to foreground, check permissions
        checkPermissionStatus();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [checkPermissionStatus]);

  const requestLocationPermissions = useCallback(async () => {
    setIsRequestingPermissions(true);
    try {
      // Request foreground permission first
      const foregroundGranted = await requestPermissionLocationForeground();
      permissionsActions.setLocationForeground(foregroundGranted);

      if (foregroundGranted) {
        // Request background permission if foreground is granted
        const backgroundGranted = await requestPermissionLocationBackground();
        permissionsActions.setLocationBackground(backgroundGranted);
        return backgroundGranted;
      }
      return false;
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    } finally {
      setIsRequestingPermissions(false);
    }
  }, []);

  const toggleFollowLocation = useCallback(
    async (value) => {
      if (value) {
        // Check if permissions are granted when enabling
        if (!locationForeground || !locationBackground) {
          const permissionsGranted = await requestLocationPermissions();
          if (!permissionsGranted) {
            // Don't enable if permissions weren't granted
            return;
          }
        }
      }

      setFollowLocation(value);
      updateAlertFollowLocationMutation({
        variables: { alertId, followLocation: value },
      });
    },
    [
      alertId,
      updateAlertFollowLocationMutation,
      locationForeground,
      locationBackground,
      requestLocationPermissions,
    ],
  );

  const hasRequiredPermissions = locationForeground && locationBackground;
  const showPermissionWarning = followLocation && !hasRequiredPermissions;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          style={styles.icon}
          size={20}
        />
        <Text style={styles.label}>Suivre ma localisation</Text>
        <Switch
          value={followLocation}
          onValueChange={toggleFollowLocation}
          color={colors.primary}
          disabled={isRequestingPermissions}
        />
      </View>

      {showPermissionWarning && (
        <View style={styles.warningContainer}>
          <View style={styles.warningContent}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              style={styles.warningIcon}
              size={16}
            />
            <Text style={styles.warningText}>
              Permissions de localisation requises
            </Text>
          </View>
          <Button
            mode="outlined"
            onPress={openSettings}
            style={styles.settingsButton}
            labelStyle={styles.settingsButtonLabel}
            compact
          >
            Paramétrer
          </Button>
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles(
  ({ wp, hp, scaleText, fontSize, theme: { colors } }) => ({
    container: {
      marginVertical: hp(1),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
    },
    icon: {
      color: colors.primary,
      marginRight: wp(2),
    },
    label: {
      flex: 1,
      ...scaleText({ fontSize: 16 }),
      color: colors.onSurface,
    },
    warningContainer: {
      marginTop: hp(1),
      paddingTop: hp(1),
      borderTopWidth: 1,
      borderTopColor: colors.outline,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    warningContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    warningIcon: {
      color: colors.error,
      marginRight: wp(1),
    },
    warningText: {
      ...scaleText({ fontSize: 14 }),
      color: colors.error,
      flex: 1,
    },
    settingsButton: {
      marginLeft: wp(2),
    },
    settingsButtonLabel: {
      ...scaleText({ fontSize: 12 }),
    },
  }),
);
