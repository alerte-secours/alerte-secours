import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { Title } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";
import CustomButton from "~/components/CustomButton";
import FallbackLocationPicker from "~/containers/FallbackLocationPicker";
import {
  saveFallbackLocation,
  clearFallbackLocation,
} from "~/network/fallbackLocationSync";
import { useToast } from "~/lib/toast-notifications";

export default function ParamsFallbackLocation({ data }) {
  const styles = useStyles();
  const theme = useTheme();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [pendingLabel, setPendingLabel] = useState("");

  const deviceData = data?.selectOneDevice;
  const currentLocation = deviceData?.fallbackLocation;
  const currentLabel = deviceData?.fallbackLocationLabel;

  // Extract coordinates from GeoJSON geography
  const currentCoords = currentLocation?.coordinates || null;

  const handleSelect = useCallback((coordinates, label) => {
    setPendingCoords(coordinates);
    setPendingLabel(label);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    if (!pendingCoords) return;
    setSaving(true);
    try {
      await saveFallbackLocation(pendingCoords, pendingLabel);
      setEditing(false);
      setPendingCoords(null);
      setPendingLabel("");
    } catch (error) {
      setSaving(false);
      toast.show(
        "Erreur lors de l'enregistrement de la position. Veuillez réessayer.",
        { type: "danger" },
      );
      return;
    }
    setSaving(false);
  }, [pendingCoords, pendingLabel, toast]);

  const handleClear = useCallback(async () => {
    setSaving(true);
    try {
      await clearFallbackLocation();
      setEditing(false);
      setPendingCoords(null);
      setPendingLabel("");
    } catch (error) {
      setSaving(false);
      toast.show(
        "Erreur lors de la suppression de la position. Veuillez réessayer.",
        { type: "danger" },
      );
      return;
    }
    setSaving(false);
  }, [toast]);

  return (
    <>
      <Title style={styles.title}>Ma position habituelle</Title>
      <Text style={styles.description}>
        Définissez l'endroit où vous vous trouvez habituellement. Cette position
        sera utilisée si votre localisation n'est pas mise à jour pendant une
        longue période.
      </Text>

      {!editing && currentCoords ? (
        <View style={styles.currentLocationContainer}>
          <View style={styles.currentLocationInfo}>
            <Ionicons
              name="location"
              size={20}
              color={theme.colors.primary}
              style={styles.locationIcon}
            />
            <Text
              style={[
                styles.currentLocationLabel,
                { color: theme.colors.onSurface },
              ]}
              numberOfLines={2}
            >
              {currentLabel || "Position définie"}
            </Text>
          </View>
          <View style={styles.currentLocationActions}>
            <CustomButton
              mode="outlined"
              onPress={() => setEditing(true)}
              disabled={saving}
              style={styles.actionButton}
            >
              Modifier
            </CustomButton>
            <CustomButton
              mode="outlined"
              onPress={handleClear}
              loading={saving}
              disabled={saving}
              style={styles.actionButton}
            >
              Supprimer
            </CustomButton>
          </View>
        </View>
      ) : !editing ? (
        <CustomButton
          mode="outlined"
          onPress={() => setEditing(true)}
          icon="map-marker-plus"
        >
          Définir ma position
        </CustomButton>
      ) : (
        <View style={styles.pickerContainer}>
          <FallbackLocationPicker
            initialCoordinates={currentCoords}
            initialLabel={currentLabel}
            onSave={handleSelect}
            onClear={currentCoords ? handleClear : undefined}
          />
          <CustomButton
            mode="contained"
            onPress={handleConfirmSave}
            loading={saving}
            disabled={saving || !pendingCoords}
            style={styles.saveButton}
          >
            Enregistrer
          </CustomButton>
          <CustomButton
            mode="outlined"
            onPress={() => setEditing(false)}
            disabled={saving}
            style={styles.cancelButton}
          >
            Annuler
          </CustomButton>
        </View>
      )}
    </>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    marginBottom: 15,
  },
  currentLocationContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: 15,
  },
  currentLocationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  locationIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  currentLocationLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  currentLocationActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  pickerContainer: {
    marginTop: 5,
  },
  saveButton: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 10,
  },
}));
