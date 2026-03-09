import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Title } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  permissionsActions,
  usePermissionsState,
  permissionWizardActions,
} from "~/stores";
import { useTheme } from "~/theme";
import openSettings from "~/lib/native/openSettings";
import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";

import requestPermissionPhoneCall from "~/permissions/requestPermissionPhoneCall";
import requestPermissionFcm from "~/permissions/requestPermissionFcm";
import requestPermissionLocationForeground from "~/permissions/requestPermissionLocationForeground";
import CustomButton from "~/components/CustomButton";
import Text from "~/components/Text";

const Welcome = () => {
  const [requesting, setRequesting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const titleRef = useRef(null);
  const lastAnnouncementRef = useRef({});
  const permissions = usePermissionsState([
    "phoneCall",
    "fcm",
    "locationForeground",
  ]);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleNext = useCallback(() => {
    permissionWizardActions.setCurrentStep("hero");
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    setRequesting(true);
    try {
      const phoneCall = await requestPermissionPhoneCall();
      const fcm = await requestPermissionFcm();
      const location = await requestPermissionLocationForeground();

      permissionsActions.setPhoneCall(phoneCall);
      permissionsActions.setFcm(fcm);
      permissionsActions.setLocationForeground(location);

      if (phoneCall && fcm && location) {
        permissionWizardActions.setBasicPermissionsGranted(true);
        permissionWizardActions.setCurrentStep("hero");
      }

      // Announce results (screen-reader only) without spamming repeated attempts.
      const entries = [
        ["phoneCall", "Appels", phoneCall],
        ["fcm", "Notifications", fcm],
        ["locationForeground", "Localisation", location],
      ];

      for (const [key, label, granted] of entries) {
        const announceKey = `${key}:${String(!!granted)}`;
        if (lastAnnouncementRef.current[key] === announceKey) continue;
        lastAnnouncementRef.current[key] = announceKey;
        await announceForA11yIfScreenReaderEnabled(
          `${label} : ${
            granted ? "permission accordée" : "permission non accordée"
          }.`,
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
    setRequesting(false);
    setHasAttempted(true);
  }, []);

  const handleRetry = useCallback(async () => {
    await handleRequestPermissions();
    setHasRetried(true);
  }, [handleRequestPermissions]);

  const allGranted =
    permissions.phoneCall && permissions.fcm && permissions.locationForeground;

  useEffect(() => {
    if (hasAttempted && allGranted) {
      handleNext();
    }
  }, [hasAttempted, allGranted, handleNext]);

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  const renderWarnings = () => {
    const warnings = [];
    if (!permissions.phoneCall) {
      warnings.push(
        "Sans la permission d'appel téléphonique, vous ne pourrez pas contacter rapidement les secours en cas de besoin.",
      );
    }
    if (!permissions.fcm) {
      warnings.push(
        "Sans les notifications, vous ne serez pas alerté en temps réel des situations d'urgence à proximité ou si vos proches ont besoin d'aide.",
      );
    }
    if (!permissions.locationForeground) {
      warnings.push(
        "Sans la localisation, vous ne pourrez pas être guidé vers les personnes ayant besoin d'aide.",
      );
    }
    return warnings.map((warning, index) => (
      <Text key={index} style={[styles.warning, { color: theme.colors.error }]}>
        <Ionicons name="warning" size={16} /> {warning}
      </Text>
    ));
  };

  const renderButton = () => {
    if (!hasAttempted) {
      return (
        <CustomButton
          mode="contained"
          onPress={handleRequestPermissions}
          loading={requesting}
          accessibilityLabel="Accorder les permissions"
          accessibilityHint="Demande les autorisations d'appels, de notifications et de localisation pendant l'utilisation."
        >
          J'accorde les permissions
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
          onPress={handleNext}
          accessibilityLabel="Ignorer"
          accessibilityHint="Continue sans accorder les permissions maintenant."
        >
          Ignorer
        </CustomButton>
        <CustomButton
          mode="contained"
          onPress={handleRetry}
          color={theme.colors.secondary}
          accessibilityLabel="Réessayer d'accorder les permissions"
          accessibilityHint="Relance la demande des autorisations."
        >
          Réessayer d'accorder les permissions
        </CustomButton>
        {hasRetried && (
          <>
            <Text
              style={[
                styles.settingsHint,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
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
          <Image
            source={require("~/assets/img/logo.png")}
            style={styles.titleImage}
            accessible={false}
            importantForAccessibility="no"
          />
          <Title
            ref={titleRef}
            accessibilityRole="header"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            <Text>Alerte-Secours</Text>
            {"\n"}
            <Text style={styles.subtitle}>Toujours prêts !</Text>
          </Title>

          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Pour être en mesure de vous aider, l'application nécessite les
            permissions suivantes :
          </Text>

          <View style={styles.permissionList}>
            <View style={styles.permissionItem}>
              <Ionicons
                name="call"
                size={24}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.permissionText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Appels téléphoniques : pour contacter rapidement les secours en
                cas d'urgence
              </Text>
            </View>
            <View style={styles.permissionItem}>
              <Ionicons
                name="notifications"
                size={24}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.permissionText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Notifications : pour être alerté des situations d'urgence et
                être informé si vos proches ont besoin d'aide
              </Text>
            </View>
            <View style={styles.permissionItem}>
              <Ionicons
                name="location"
                size={24}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.permissionText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Localisation : pour pouvoir transmettre efficacement votre
                position aux secours, à vos proches, et aux personnes autour de
                vous en cas d'urgence
              </Text>
            </View>
          </View>

          {!allGranted && hasAttempted && renderWarnings()}

          <View style={styles.buttonContainer}>{renderButton()}</View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  titleImage: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
    resizeMode: "contain",
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
    marginBottom: 20,
    lineHeight: 24,
    textAlign: "left",
  },
  permissionList: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  permissionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
    textAlign: "left",
  },
  warning: {
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
  },
  settingsHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default Welcome;
