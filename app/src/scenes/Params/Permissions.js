import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AppState,
} from "react-native";
import { Button, Title } from "react-native-paper";
import { usePermissionsState, permissionsActions } from "~/stores";
import { Ionicons } from "@expo/vector-icons";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import {
  requestBatteryOptimizationExemption,
  isBatteryOptimizationEnabled,
} from "~/lib/native/batteryOptimization";
import openSettings from "~/lib/native/openSettings";
import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";

import requestPermissionFcm from "~/permissions/requestPermissionFcm";
import requestPermissionLocationBackground from "~/permissions/requestPermissionLocationBackground";
import requestPermissionLocationForeground from "~/permissions/requestPermissionLocationForeground";
import requestPermissionReadContacts from "~/permissions/requestPermissionReadContacts";
import requestPermissionPhoneCall from "~/permissions/requestPermissionPhoneCall";
import requestPermissionMotion from "~/permissions/requestPermissionMotion";
import Text from "~/components/Text";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Contacts from "expo-contacts";

const requestBatteryOptimizationDisable = async () => {
  if (Platform.OS !== "android") return true;

  try {
    const enabled = await isBatteryOptimizationEnabled();
    if (enabled) {
      console.log("Battery optimization enabled, requesting exemption...");
      await requestBatteryOptimizationExemption();
      // User must interact in Settings; will re-check on AppState 'active'
      return false;
    }
    console.log("Battery optimization already disabled");
    return true;
  } catch (error) {
    console.error("Error handling battery optimization:", error);
    return false;
  }
};

const requestPermissions = {
  fcm: requestPermissionFcm,
  locationBackground: requestPermissionLocationBackground,
  locationForeground: requestPermissionLocationForeground,
  readContacts: requestPermissionReadContacts,
  phoneCall: requestPermissionPhoneCall,
  motion: requestPermissionMotion.requestPermission,
  batteryOptimizationDisabled: requestBatteryOptimizationDisable,
};

const setPermissions = {
  fcm: (b) => permissionsActions.setFcm(b),
  locationBackground: (b) => permissionsActions.setLocationBackground(b),
  locationForeground: (b) => permissionsActions.setLocationForeground(b),
  readContacts: (b) => permissionsActions.setReadContacts(b),
  phoneCall: (b) => permissionsActions.setPhoneCall(b),
  motion: (b) => permissionsActions.setMotion(b),
  batteryOptimizationDisabled: (b) =>
    permissionsActions.setBatteryOptimizationDisabled(b),
};

const titlePermissions = {
  fcm: "Notifications",
  locationBackground: "Localisation en arrière plan",
  locationForeground: "Localisation en cours d'activité",
  readContacts: "Contacts",
  phoneCall: "Appels",
  motion: "Détection de mouvement",
  batteryOptimizationDisabled: "Optimisation de la batterie",
};

const a11yDescriptions = {
  fcm: {
    purpose: "Recevoir des alertes et des messages importants en temps réel.",
    settingsGuidance:
      "Si la permission est bloquée, ouvrez les paramètres du téléphone pour l'activer.",
  },
  phoneCall: {
    purpose:
      "Permettre à l'application de lancer un appel vers les secours quand vous le demandez.",
    settingsGuidance:
      "Si la permission est bloquée, ouvrez les paramètres du téléphone pour l'activer.",
  },
  locationForeground: {
    purpose: "Partager votre position pendant l'utilisation de l'application.",
    settingsGuidance:
      "Si la permission est bloquée, ouvrez les paramètres du téléphone pour l'activer.",
  },
  locationBackground: {
    purpose:
      "Partager votre position même quand l'application est fermée, pour être alerté à proximité.",
    settingsGuidance:
      "Si la permission est bloquée, ouvrez les paramètres du téléphone pour l'activer.",
  },
  motion: {
    purpose:
      "Optimiser la localisation en arrière-plan sans enregistrer de données de mouvement.",
    settingsGuidance:
      "Si la permission est bloquée, ouvrez les paramètres du téléphone pour l'activer.",
  },
  readContacts: {
    purpose:
      "Accéder à vos contacts pour faciliter le choix d'un proche (si vous utilisez cette fonctionnalité).",
    settingsGuidance:
      "Si la permission est bloquée, ouvrez les paramètres du téléphone pour l'activer.",
  },
  batteryOptimizationDisabled: {
    purpose:
      "Désactiver l'optimisation de la batterie pour permettre le fonctionnement en arrière-plan sur Android.",
    settingsGuidance:
      "Ouvrez les paramètres Android pour définir l'application sur « Ne pas optimiser ».",
  },
};

// Function to check current permission status
const checkPermissionStatus = async (permission) => {
  try {
    switch (permission) {
      case "fcm":
        const { status: notifStatus } =
          await Notifications.getPermissionsAsync();
        return notifStatus === "granted";
      case "locationBackground":
        const { status: bgStatus } =
          await Location.getBackgroundPermissionsAsync();
        return bgStatus === "granted";
      case "locationForeground":
        const { status: fgStatus } =
          await Location.getForegroundPermissionsAsync();
        return fgStatus === "granted";
      case "readContacts":
        const { status: contactStatus } = await Contacts.getPermissionsAsync();
        return contactStatus === "granted";
      case "motion":
        return await requestPermissionMotion.checkPermission();
      case "phoneCall":
        if (Platform.OS !== "android") return true;
        return (
          (await check(PERMISSIONS.ANDROID.CALL_PHONE)) === RESULTS.GRANTED
        );
      case "batteryOptimizationDisabled":
        if (Platform.OS !== "android") {
          return true; // iOS doesn't have battery optimization
        }
        try {
          const enabled = await isBatteryOptimizationEnabled();
          return !enabled; // true if optimization is disabled
        } catch (error) {
          console.error("Error checking battery optimization:", error);
          return false;
        }
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking ${permission} permission:`, error);
    return false;
  }
};

const getPermissionA11yMeta = async (permission) => {
  try {
    switch (permission) {
      case "fcm": {
        const { status, canAskAgain } =
          await Notifications.getPermissionsAsync();
        return {
          granted: status === "granted",
          blocked: status !== "granted" && canAskAgain === false,
        };
      }
      case "locationForeground": {
        const { status, canAskAgain } =
          await Location.getForegroundPermissionsAsync();
        return {
          granted: status === "granted",
          blocked: status !== "granted" && canAskAgain === false,
        };
      }
      case "locationBackground": {
        const { status, canAskAgain } =
          await Location.getBackgroundPermissionsAsync();
        return {
          granted: status === "granted",
          blocked: status !== "granted" && canAskAgain === false,
        };
      }
      case "readContacts": {
        const { status, canAskAgain } = await Contacts.getPermissionsAsync();
        return {
          granted: status === "granted",
          blocked: status !== "granted" && canAskAgain === false,
        };
      }
      case "motion": {
        if (Platform.OS !== "android") {
          return { granted: true, blocked: false };
        }
        const status = await check(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
        return {
          granted: status === RESULTS.GRANTED,
          blocked: status === RESULTS.BLOCKED,
        };
      }
      case "phoneCall": {
        if (Platform.OS !== "android") {
          return { granted: true, blocked: false };
        }
        const status = await check(PERMISSIONS.ANDROID.CALL_PHONE);
        return {
          granted: status === RESULTS.GRANTED,
          blocked: status === RESULTS.BLOCKED,
        };
      }
      case "batteryOptimizationDisabled": {
        if (Platform.OS !== "android") {
          return { granted: true, blocked: false };
        }
        const enabled = await isBatteryOptimizationEnabled();
        return {
          granted: !enabled,
          blocked: false,
        };
      }
      default:
        return { granted: false, blocked: false };
    }
  } catch (error) {
    console.error(`Error getting a11y meta for ${permission}:`, error);
    return { granted: false, blocked: false };
  }
};

const PermissionItem = ({
  permission,
  status,
  blocked,
  onRequestPermission,
  onOpenSettings,
}) => {
  const label = titlePermissions[permission];
  const description = a11yDescriptions[permission]?.purpose;
  const hintWhenEnabled =
    "Permission accordée. Pour la retirer, utilisez les réglages du téléphone.";
  const hintWhenDisabled = `Active ${label.toLowerCase()} : ${description}`;
  const hintWhenBlocked =
    a11yDescriptions[permission]?.settingsGuidance ??
    "Permission bloquée. Ouvrez les paramètres du téléphone.";

  let computedHint = hintWhenDisabled;
  if (blocked) {
    computedHint = hintWhenBlocked;
  } else if (status) {
    computedHint = hintWhenEnabled;
  }

  return (
    <View style={styles.permissionItem}>
      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityHint={computedHint}
        accessibilityState={{ checked: !!status, disabled: !!blocked }}
        disabled={blocked}
        onPress={() => onRequestPermission(permission)}
        style={styles.permissionButton}
      >
        <Text style={styles.permissionText}>{label}</Text>

        <Ionicons
          accessible={false}
          importantForAccessibility="no"
          name={status ? "checkmark-circle" : "close-circle"}
          size={24}
          color={status ? "green" : "red"}
        />
      </TouchableOpacity>

      {blocked ? (
        <View style={styles.blockedRow}>
          <Text style={styles.blockedText}>
            Action requise : paramètres du téléphone.
          </Text>
          <Button
            mode="outlined"
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir les paramètres pour ${label}`}
            accessibilityHint={`Ouvre les paramètres du téléphone pour activer ${label.toLowerCase()}.`}
          >
            Ouvrir les paramètres
          </Button>
        </View>
      ) : null}
    </View>
  );
};

export default function Permissions() {
  // IMPORTANT: keep a stable permissions list across renders.
  // If this array changes identity each render, it re-creates callbacks and can
  // trigger a re-render loop via permission checks + store updates.
  const permissionsList = useMemo(() => {
    const basePermissions = [
      "fcm",
      "phoneCall",
      "locationForeground",
      "locationBackground",
      "motion",
      "readContacts",
    ];
    return Platform.OS === "android"
      ? [...basePermissions, "batteryOptimizationDisabled"]
      : basePermissions;
  }, []);
  const permissionsState = usePermissionsState(permissionsList);

  const titleRef = useRef(null);
  const lastAnnouncementRef = useRef({});
  const lastSetPermissionRef = useRef({});
  const lastBlockedMapRef = useRef(null);

  // We keep a minimal, best-effort blocked map for a11y/UX.
  const [blockedMap, setBlockedMap] = React.useState({});

  // Memoize the check permissions function.
  // NOTE: Do NOT depend on permissionsState here (it changes on each store update),
  // or we can re-run effects and create a log spam loop.
  const checkAllPermissions = useCallback(async () => {
    // Update store only when values actually change, to avoid churn.
    for (const permission of permissionsList) {
      const status = await checkPermissionStatus(permission);
      if (lastSetPermissionRef.current[permission] !== status) {
        lastSetPermissionRef.current[permission] = status;
        setPermissions[permission](status);
      }
    }

    // Also refresh "blocked" state used for a11y guidance.
    const nextBlocked = {};
    for (const permission of permissionsList) {
      const meta = await getPermissionA11yMeta(permission);
      nextBlocked[permission] = !!meta.blocked;
    }

    // Avoid re-setting state if unchanged (prevents extra re-renders).
    const nextBlockedKey = JSON.stringify(nextBlocked);
    if (lastBlockedMapRef.current !== nextBlockedKey) {
      lastBlockedMapRef.current = nextBlockedKey;
      setBlockedMap(nextBlocked);
    }
  }, [permissionsList]);

  // Check all permissions when component mounts
  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  // Listen for app state changes to re-check permissions when user returns from settings
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "active") {
        console.log("App became active, re-checking all permissions...");
        // Re-check all permissions when app becomes active
        await checkAllPermissions();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [checkAllPermissions]);

  const handleRequestPermission = async (permission) => {
    try {
      let granted = false;
      const previous = !!permissionsState?.[permission];

      if (permission === "locationBackground") {
        // Ensure foreground location is granted first
        const fgGranted = await checkPermissionStatus("locationForeground");
        if (!fgGranted) {
          const fgReq = await requestPermissionLocationForeground();
          setPermissions.locationForeground(fgReq);
          if (!fgReq) {
            granted = false;
          } else {
            granted = await requestPermissionLocationBackground();
          }
        } else {
          granted = await requestPermissionLocationBackground();
        }
        setPermissions.locationBackground(granted);
      } else {
        granted = await requestPermissions[permission]();
        setPermissions[permission](granted);
      }

      // Double-check the status to ensure UI is in sync.
      // For battery optimization, this immediate check may still be 'enabled';
      // we'll re-check again on AppState 'active' after returning from Settings.
      const actualStatus = await checkPermissionStatus(permission);
      setPermissions[permission](actualStatus);

      const meta = await getPermissionA11yMeta(permission);
      setBlockedMap((prevMap) => ({
        ...prevMap,
        [permission]: !!meta.blocked,
      }));

      // Announce only on changes or first explicit failure.
      const lastKey = `${permission}:${String(actualStatus)}:${String(
        meta.blocked,
      )}`;
      if (lastAnnouncementRef.current[permission] !== lastKey) {
        if (actualStatus && !previous) {
          await announceForA11yIfScreenReaderEnabled(
            `${titlePermissions[permission]} : permission accordée.`,
          );
          lastAnnouncementRef.current[permission] = lastKey;
        } else if (!actualStatus && previous) {
          await announceForA11yIfScreenReaderEnabled(
            `${titlePermissions[permission]} : permission retirée.`,
          );
          lastAnnouncementRef.current[permission] = lastKey;
        } else if (!actualStatus && meta.blocked) {
          await announceForA11yIfScreenReaderEnabled(
            `${titlePermissions[permission]} : permission bloquée. Ouvrez les paramètres du téléphone.`,
          );
          lastAnnouncementRef.current[permission] = lastKey;
        } else if (!actualStatus && !previous) {
          await announceForA11yIfScreenReaderEnabled(
            `${titlePermissions[permission]} : permission non accordée.`,
          );
          lastAnnouncementRef.current[permission] = lastKey;
        }
      }
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
    }
  };

  return (
    <>
      <Title ref={titleRef} accessibilityRole="header" style={styles.title}>
        Permissions
      </Title>
      <View style={styles.container}>
        {Object.entries(permissionsState).map(([permission, status]) => (
          <PermissionItem
            key={permission}
            permission={permission}
            status={status}
            blocked={!!blockedMap[permission]}
            onRequestPermission={handleRequestPermission}
            onOpenSettings={openSettings}
          />
        ))}
        <Button
          mode="contained"
          onPress={openSettings}
          style={styles.settingsButton}
          accessibilityRole="button"
          accessibilityLabel="Paramétrer les permissions"
          accessibilityHint="Ouvre les paramètres du téléphone pour gérer les autorisations de l'application."
        >
          Paramétrer les permissions
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", marginVertical: 15 },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  permissionText: {
    fontSize: 16,
    flex: 1,
  },
  blockedRow: {
    marginTop: 8,
  },
  blockedText: {
    fontSize: 14,
    marginBottom: 6,
  },
  settingsButton: {},
});
