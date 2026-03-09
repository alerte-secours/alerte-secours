import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  AppState,
} from "react-native";
import { Title } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Entypo } from "@expo/vector-icons";
import {
  permissionsActions,
  usePermissionsState,
  permissionWizardActions,
} from "~/stores";
import { createStyles, useTheme } from "~/theme";
import openSettings from "~/lib/native/openSettings";
import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";
import {
  RequestDisableOptimization,
  BatteryOptEnabled,
} from "react-native-battery-optimization-check";

import requestPermissionLocationBackground from "~/permissions/requestPermissionLocationBackground";
import requestPermissionMotion from "~/permissions/requestPermissionMotion";
import CustomButton from "~/components/CustomButton";
import Text from "~/components/Text";

const skipMessages = [
  "Non merci, je préfère rester égoïste",
  "Les héros ? Très peu pour moi !",
  "J'ai peur des responsabilités...",
  "Je suis trop douillet pour être un héros...",
  "Non merci, je préfère rester sur mon canapé",
  "Les héros ? Ça me donne des boutons !",
  "J'ai une allergie aux bonnes actions",
  "Désolé, mon chat a besoin de moi",
];

const HeroMode = () => {
  const [requesting, setRequesting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [batteryOptimizationEnabled, setBatteryOptimizationEnabled] =
    useState(null);
  const [batteryOptAttempted, setBatteryOptAttempted] = useState(false);
  const [batteryOptInProgress, setBatteryOptInProgress] = useState(false);
  const permissions = usePermissionsState([
    "locationBackground",
    "motion",
    "batteryOptimizationDisabled",
  ]);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const titleRef = useRef(null);
  const lastAnnouncementRef = useRef({});

  const [skipMessage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * skipMessages.length);
    return skipMessages[randomIndex];
  });

  const handleNext = useCallback(() => {
    permissionWizardActions.setCurrentStep("success");
  }, []);

  const handleSkip = useCallback(() => {
    permissionWizardActions.setCurrentStep("skipInfo");
  }, []);

  const handleBatteryOptimization = useCallback(async () => {
    if (Platform.OS !== "android") {
      permissionsActions.setBatteryOptimizationDisabled(true);
      return true;
    }

    try {
      setBatteryOptInProgress(true);

      // Check if battery optimization is enabled
      const isEnabled = await BatteryOptEnabled();
      setBatteryOptimizationEnabled(isEnabled);

      if (isEnabled) {
        console.log(
          "Battery optimization is enabled, requesting to disable...",
        );

        // Request to disable battery optimization (opens Android Settings)
        RequestDisableOptimization();
        setBatteryOptAttempted(true);

        // Return false to indicate user needs to complete action in Settings
        return false;
      } else {
        console.log("Battery optimization already disabled");
        permissionsActions.setBatteryOptimizationDisabled(true);
        return true;
      }
    } catch (error) {
      console.error("Error handling battery optimization:", error);
      setBatteryOptAttempted(true);
      return false;
    } finally {
      setBatteryOptInProgress(false);
    }
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    setRequesting(true);
    try {
      // Don't change step immediately to avoid race conditions
      console.log("Starting permission requests...");

      // Request background location last (after user returns from Settings if needed)
      const locationGranted = await requestPermissionLocationBackground();
      permissionsActions.setLocationBackground(locationGranted);
      console.log("Location background permission:", locationGranted);

      if (
        lastAnnouncementRef.current.locationBackground !==
        String(!!locationGranted)
      ) {
        lastAnnouncementRef.current.locationBackground = String(
          !!locationGranted,
        );
        await announceForA11yIfScreenReaderEnabled(
          `Localisation en arrière-plan : ${
            locationGranted ? "permission accordée" : "permission non accordée"
          }.`,
        );
      }

      // Request motion permission second
      const motionGranted = await requestPermissionMotion.requestPermission();
      permissionsActions.setMotion(motionGranted);
      console.log("Motion permission:", motionGranted);

      if (lastAnnouncementRef.current.motion !== String(!!motionGranted)) {
        lastAnnouncementRef.current.motion = String(!!motionGranted);
        await announceForA11yIfScreenReaderEnabled(
          `Détection de mouvement : ${
            motionGranted ? "permission accordée" : "permission non accordée"
          }.`,
        );
      }

      permissionWizardActions.setCurrentStep("tracking");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const batteryOptDisabled = await handleBatteryOptimization();
      console.log("Battery optimization disabled:", batteryOptDisabled);

      if (
        Platform.OS === "android" &&
        lastAnnouncementRef.current.batteryOptimizationDisabled !==
          String(!!batteryOptDisabled)
      ) {
        lastAnnouncementRef.current.batteryOptimizationDisabled = String(
          !!batteryOptDisabled,
        );
        await announceForA11yIfScreenReaderEnabled(
          `Optimisation de la batterie : ${
            batteryOptDisabled
              ? "désactivée"
              : "toujours activée. Ouvrez les paramètres Android."
          }`,
        );
      }

      // Check if we should proceed to success immediately
      if (locationGranted && motionGranted && batteryOptDisabled) {
        permissionWizardActions.setHeroPermissionsGranted(true);
        // Don't navigate immediately, let the useEffect handle it
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
    setRequesting(false);
    setHasAttempted(true);
  }, [handleBatteryOptimization]);

  const handleRetry = useCallback(async () => {
    // Re-check battery optimization status before retrying
    if (Platform.OS === "android") {
      try {
        const isEnabled = await BatteryOptEnabled();
        setBatteryOptimizationEnabled(isEnabled);

        // If battery optimization is now disabled, update the store
        if (!isEnabled) {
          console.log("Battery optimization now disabled after retry");
          permissionsActions.setBatteryOptimizationDisabled(true);
        }
      } catch (error) {
        console.error("Error re-checking battery optimization:", error);
      }
    }

    // Only request permissions again if some are still missing
    const needsRetry =
      !permissions.locationBackground ||
      !permissions.motion ||
      (Platform.OS === "android" && batteryOptimizationEnabled);

    if (needsRetry) {
      await handleRequestPermissions();
    }

    setHasRetried(true);
  }, [handleRequestPermissions, permissions, batteryOptimizationEnabled]);

  const allGranted =
    permissions.locationBackground &&
    permissions.motion &&
    (Platform.OS === "ios" || !batteryOptimizationEnabled);

  // Check battery optimization status on mount
  useEffect(() => {
    const checkInitialBatteryOptimization = async () => {
      if (Platform.OS === "android") {
        try {
          const isEnabled = await BatteryOptEnabled();
          setBatteryOptimizationEnabled(isEnabled);

          // If already disabled, update the store
          if (!isEnabled) {
            permissionsActions.setBatteryOptimizationDisabled(true);
          }
        } catch (error) {
          console.error("Error checking initial battery optimization:", error);
        }
      } else {
        // iOS doesn't have battery optimization, so mark as disabled
        permissionsActions.setBatteryOptimizationDisabled(true);
      }
    };

    checkInitialBatteryOptimization();
  }, []);

  // Listen for app state changes to re-check battery optimization when user returns from settings
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        nextAppState === "active" &&
        Platform.OS === "android" &&
        batteryOptAttempted
      ) {
        console.log("App became active, re-checking battery optimization...");
        try {
          const isEnabled = await BatteryOptEnabled();
          setBatteryOptimizationEnabled(isEnabled);

          if (!isEnabled) {
            console.log(
              "Battery optimization disabled after returning from settings",
            );
            permissionsActions.setBatteryOptimizationDisabled(true);
          }
        } catch (error) {
          console.error(
            "Error re-checking battery optimization on app focus:",
            error,
          );
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [batteryOptAttempted]);

  useEffect(() => {
    if (hasAttempted && allGranted) {
      handleNext();
    }
  }, [hasAttempted, allGranted, handleNext]);

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  const styles = useStyles();

  const renderWarnings = () => {
    const warnings = [];
    if (!permissions.motion) {
      warnings.push(
        "Sans la détection de mouvement, la localisation en arrière-plan ne pourra pas fonctionner.",
      );
    }
    if (!permissions.locationBackground) {
      warnings.push(
        "Sans la localisation en arrière-plan, vous ne pourrez pas être alerté des situations d'urgence à proximité lorsque l'application est fermée.",
      );
    }
    // Battery optimization warning is now handled in the Android settings box
    return warnings.length > 0 ? (
      <View style={styles.warningsContainer}>
        {warnings.map((warning, index) => (
          <Text
            key={index}
            style={[styles.warning, { color: theme.colors.error }]}
          >
            <Ionicons name="warning" size={16} /> {warning}
          </Text>
        ))}
      </View>
    ) : null;
  };

  const renderAndroidPermissionWarning = () => {
    const hasBatteryOptimizationIssue =
      batteryOptimizationEnabled && batteryOptAttempted;

    return (
      <View
        style={[
          styles.androidWarning,
          hasBatteryOptimizationIssue && styles.androidWarningCritical,
        ]}
      >
        <View style={styles.androidWarningHeader}>
          <Ionicons name="warning" size={24} color={theme.colors.warn} />
          <Text style={styles.androidWarningTitle}>Paramètres Android</Text>
        </View>

        {hasBatteryOptimizationIssue && (
          <View style={styles.batteryOptimizationAlert}>
            <Text
              style={[
                styles.batteryOptimizationAlertText,
                { color: theme.colors.error },
              ]}
            >
              <Ionicons name="warning" size={16} /> L'optimisation de la
              batterie est encore activée. L'application pourrait ne pas
              fonctionner correctement en arrière-plan.
            </Text>
          </View>
        )}

        <Text style={styles.androidWarningDescription}>
          Sur Android, les permissions peuvent être automatiquement révoquées si
          l'application n'est pas utilisée pendant une longue période.
        </Text>
        <View style={styles.androidWarningSteps}>
          <Text style={styles.androidWarningText}>
            Pour garantir le bon fonctionnement de l'application :
          </Text>
          <Text style={styles.androidWarningStep}>
            1. Accédez aux paramètres de l'application
          </Text>
          <Text style={styles.androidWarningStep}>
            2. Recherchez la section "Autorisations" ou "Permissions"
          </Text>
          <Text style={styles.androidWarningStep}>
            3. Désactivez l'option "Supprimer les autorisations si l'application
            n'est pas utilisée" (l'emplacement exact peut varier selon votre
            version d'Android)
          </Text>
        </View>
        {hasBatteryOptimizationIssue && (
          <View style={styles.androidWarningSteps}>
            <Text
              style={[
                styles.androidWarningText,
                styles.batteryOptimizationText,
              ]}
            >
              Pour désactiver l'optimisation de la batterie :
            </Text>
            <Text style={styles.androidWarningStep}>
              4. Recherchez "Batterie" ou "Optimisation de la batterie"
            </Text>
            <Text style={styles.androidWarningStep}>
              5. Trouvez cette application dans la liste
            </Text>
            <Text style={styles.androidWarningStep}>
              6. Sélectionnez "Ne pas optimiser" ou "Désactiver l'optimisation"
            </Text>
          </View>
        )}
        <CustomButton
          mode="outlined"
          onPress={openSettings}
          style={styles.androidSettingsButton}
          accessibilityLabel="Ouvrir les paramètres Android"
          accessibilityHint="Ouvre les paramètres du téléphone pour activer les autorisations et désactiver l'optimisation de la batterie."
        >
          Ouvrir les paramètres
        </CustomButton>
      </View>
    );
  };

  const renderPlatformWarning = () => {
    if (Platform.OS === "ios") {
      return renderIOSPermissionWarning();
    } else if (Platform.OS === "android") {
      return renderAndroidPermissionWarning();
    }
    return null;
  };

  const renderIOSPermissionWarning = () => {
    return (
      <View style={styles.iosWarning}>
        <View style={styles.iosWarningHeader}>
          <Ionicons name="warning" size={24} color={theme.colors.warn} />
          <Text style={styles.iosWarningTitle}>Paramètres iOS</Text>
        </View>
        <Text style={styles.iosWarningDescription}>
          Pour garantir le bon fonctionnement de l'application en arrière-plan,
          quelques réglages supplémentaires sont nécessaires.
        </Text>
        <View style={styles.iosWarningSteps}>
          <Text style={styles.iosWarningText}>
            1. Activez l'actualisation en arrière-plan :
          </Text>
          <Text style={styles.iosWarningStep}>
            • {"Réglages > Général > Actualisation en arrière-plan"}
          </Text>
          <Text style={styles.iosWarningStep}>
            • Activez l'option pour cette application
          </Text>
        </View>
        <View style={styles.iosWarningSteps}>
          <Text style={styles.iosWarningText}>
            2. Attention aux modes qui peuvent limiter le fonctionnement :
          </Text>
          <Text style={styles.iosWarningStep}>
            • Le mode économie d'énergie
          </Text>
          <Text style={styles.iosWarningStep}>
            • Le mode concentration (Ne pas déranger)
          </Text>
        </View>
        <CustomButton
          mode="outlined"
          onPress={openSettings}
          style={styles.iosSettingsButton}
          accessibilityLabel="Ouvrir les réglages iOS"
          accessibilityHint="Ouvre les réglages du téléphone pour vérifier les autorisations et les options de fonctionnement en arrière-plan."
        >
          Ouvrir les réglages
        </CustomButton>
      </View>
    );
  };

  const renderButton = () => {
    if (!hasAttempted) {
      return (
        <CustomButton
          mode="contained"
          onPress={handleRequestPermissions}
          loading={requesting}
          disabled={batteryOptInProgress}
        >
          {batteryOptInProgress
            ? "Traitement de l'optimisation de la batterie..."
            : "J'accorde les permissions"}
        </CustomButton>
      );
    }

    if (allGranted) {
      return (
        <CustomButton mode="contained" onPress={handleNext}>
          Suivant
        </CustomButton>
      );
    }

    return (
      <>
        <CustomButton
          mode="contained"
          onPress={handleSkip}
          color={theme.colors.secondary}
        >
          {skipMessage}
        </CustomButton>
        <CustomButton
          mode="contained"
          onPress={handleRetry}
          loading={requesting}
          disabled={batteryOptInProgress}
        >
          {batteryOptInProgress
            ? "Vérification en cours..."
            : "Réessayer d'accorder les permissions"}
        </CustomButton>
        {hasRetried && (
          <>
            <Text style={[styles.settingsHint, { color: theme.colors.text }]}>
              Si les permissions ne sont pas accordées, vous devez les activer
              manuellement dans les paramètres de votre téléphone.
            </Text>
            <CustomButton mode="outlined" onPress={openSettings}>
              Paramètres
            </CustomButton>
          </>
        )}
      </>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.heroHeader}>
            <Image
              source={require("~/assets/img/wizard-heromode.png")}
              style={styles.heroImage}
              resizeMode="contain"
              accessible={false}
              importantForAccessibility="no"
            />
            <Title
              ref={titleRef}
              accessibilityRole="header"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Rejoignez les vrais{"\n"}
              <Text style={styles.subtitle}>Soyez prêt à agir</Text>
            </Title>
          </View>

          <Text style={[styles.description, { color: theme.colors.primary }]}>
            Pas besoin de super-pouvoirs pour être un héros, il vous suffit
            simplement d'activer les autorisations nécessaires qui permettront
            de vous alerter. Ensuite, répondre présent pour apporter votre aide
            fera la différence !
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions requises</Text>
            <View style={styles.permissionList}>
              <View style={styles.permissionItem}>
                <Entypo name="location" size={24} style={styles.icon} />
                <Text style={styles.permissionText}>
                  Localisation en arrière-plan : pour être alerté des situations
                  d'urgence à proximité même lorsque l'application est fermée.
                </Text>
              </View>
              <View style={styles.permissionItem}>
                <Entypo name="battery" size={24} style={styles.icon} />
                <Text style={styles.permissionText}>
                  Détection de mouvement : pour optimiser la consommation de
                  batterie lors de la localisation en arrière-plan, aucune
                  donnée de mouvement n'est stockée ni transmise.
                </Text>
              </View>
              {Platform.OS === "android" && (
                <View style={styles.permissionItem}>
                  <Ionicons
                    name="battery-charging"
                    size={24}
                    style={styles.icon}
                  />
                  <Text style={styles.permissionText}>
                    Optimisation de la batterie : désactiver l'optimisation de
                    la batterie pour cette application afin qu'elle puisse
                    fonctionner correctement en arrière-plan.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important</Text>
            <View style={styles.permissionItem}>
              <Entypo name="warning" size={24} style={styles.icon} />
              <Text style={styles.permissionText}>
                N'oubliez pas de garder la localisation de votre téléphone
                activée pour que l'application puisse fonctionner correctement !
              </Text>
            </View>
          </View>

          {!allGranted && hasAttempted && renderWarnings()}

          {renderPlatformWarning()}

          <View style={styles.buttonContainer}>{renderButton()}</View>
        </View>
      </ScrollView>
    </View>
  );
};

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  heroHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  heroImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 22,
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 24,
    textAlign: "left",
    color: colors.onSurfaceVariant,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 15,
  },
  permissionList: {
    gap: 15,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  permissionContent: {
    flex: 1,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
    color: colors.primary,
  },
  permissionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
    textAlign: "left",
    color: colors.onSurfaceVariant,
  },
  warningsContainer: {
    backgroundColor: colors.surfaceVariant,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.error,
  },
  warning: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: "left",
    color: colors.onSurfaceVariant,
  },
  settingsHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
    color: colors.onSurfaceVariant,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  // Android styles
  androidWarning: {
    backgroundColor: colors.surfaceVariant,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warn,
  },
  androidWarningCritical: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  androidWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  androidWarningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.warn,
  },
  androidWarningDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 15,
  },
  androidWarningSteps: {
    marginBottom: 15,
  },
  androidWarningText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 10,
  },
  androidWarningStep: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginLeft: 15,
    marginBottom: 5,
  },
  androidSettingsButton: {
    marginTop: 5,
    color: colors.primary,
  },
  batteryOptimizationAlert: {
    backgroundColor: colors.surfaceVariant,
    padding: 15,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.error,
  },
  batteryOptimizationAlertText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  batteryOptimizationText: {
    fontWeight: "600",
    color: colors.error,
  },
  // iOS styles
  iosWarning: {
    backgroundColor: colors.surfaceVariant,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warn,
  },
  iosWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  iosWarningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.warn,
  },
  iosWarningDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 15,
  },
  iosWarningSteps: {
    marginBottom: 15,
  },
  iosWarningText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 10,
  },
  iosWarningStep: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginLeft: 15,
    marginBottom: 5,
  },
  iosSettingsButton: {
    marginTop: 5,
    color: colors.primary,
  },
}));

export default HeroMode;
