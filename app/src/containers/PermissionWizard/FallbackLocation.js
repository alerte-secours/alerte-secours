import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { Title } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { permissionWizardActions } from "~/stores";
import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";
import CustomButton from "~/components/CustomButton";
import { setA11yFocusAfterInteractions } from "~/lib/a11y";
import FallbackLocationPicker from "~/containers/FallbackLocationPicker";
import { useToast } from "~/lib/toast-notifications";
import { saveFallbackLocation } from "~/network/fallbackLocationSync";

const FallbackLocation = () => {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const titleRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [pendingLabel, setPendingLabel] = useState("");

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  const handleNext = useCallback(() => {
    permissionWizardActions.setCurrentStep("success");
  }, []);

  const handleSave = useCallback((coordinates, label) => {
    setPendingCoords(coordinates);
    setPendingLabel(label);
    setLocationSelected(true);
  }, []);

  const handleContinue = useCallback(async () => {
    if (pendingCoords) {
      setSaving(true);
      try {
        await saveFallbackLocation(pendingCoords, pendingLabel);
      } catch (error) {
        setSaving(false);
        toast.show(
          "Erreur lors de l'enregistrement de la position. Veuillez réessayer.",
          { type: "danger" },
        );
        return;
      }
      setSaving(false);
    }
    handleNext();
  }, [pendingCoords, pendingLabel, handleNext, toast]);

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
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="home" size={60} color={theme.colors.primary} />
            </View>
            <Title
              ref={titleRef}
              accessibilityRole="header"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Ma position habituelle
            </Title>
          </View>

          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Définissez l'endroit où vous vous trouvez habituellement (domicile,
            travail...).{"\n\n"}Si votre localisation n'est pas mise à jour
            pendant une longue période, cette position sera utilisée pour
            continuer à vous alerter des urgences à proximité.
          </Text>

          <FallbackLocationPicker
            initialCoordinates={null}
            initialLabel={null}
            onSave={handleSave}
          />

          <View style={styles.buttonContainer}>
            <CustomButton
              mode="contained"
              onPress={handleContinue}
              loading={saving}
              disabled={saving || !locationSelected}
            >
              Enregistrer et continuer
            </CustomButton>
            <CustomButton
              mode="outlined"
              onPress={handleNext}
              disabled={saving}
            >
              Passer cette étape
            </CustomButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
}));

export default FallbackLocation;
