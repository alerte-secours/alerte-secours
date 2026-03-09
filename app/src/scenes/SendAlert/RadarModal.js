import React, { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { Modal, Portal, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles, useTheme } from "~/theme";
import { setA11yFocusAfterInteractions } from "~/lib/a11y";

export default function RadarModal({
  visible,
  onDismiss,
  peopleCount = null,
  isLoading = false,
  error = null,
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  const titleRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setA11yFocusAfterInteractions(titleRef);
  }, [visible]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Recherche d'utilisateurs Alerte-Secours disponibles aux alentours...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>
            Impossible de récupérer les informations. Vérifiez votre connexion
            et votre localisation.
          </Text>
        </View>
      );
    }

    if (peopleCount !== null) {
      return (
        <View style={styles.successContainer}>
          <Text style={styles.countText}>{peopleCount}</Text>
          <Text style={styles.descriptionText}>
            {peopleCount === 0
              ? "Aucun utilisateur d'Alerte-Secours disponible pour assistance dans un rayon de 25 km"
              : peopleCount === 1
              ? "utilisateur d'Alerte-Secours prêt à porter secours dans un rayon de 25 km"
              : "utilisateurs d'Alerte-Secours prêts à porter secours dans un rayon de 25 km"}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.modalHeader}>
          <MaterialCommunityIcons
            name="radar"
            size={32}
            color={colors.primary}
            style={styles.modalIcon}
          />
          <Text
            ref={titleRef}
            accessibilityRole="header"
            style={styles.modalTitle}
          >
            Utilisateurs aux alentours
          </Text>
        </View>

        <View style={styles.content}>
          {renderContent()}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={onDismiss}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              accessibilityHint="Ferme la fenêtre radar et revient à l'écran d'alerte."
            >
              Fermer
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  modalContainer: {
    margin: wp(5),
    borderRadius: 8,
    padding: wp(5),
    elevation: 5,
  },
  content: {
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: hp(3),
  },
  loadingText: {
    ...scaleText({ fontSize: 16 }),
    color: colors.onSurface,
    marginTop: hp(2),
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: hp(2),
  },
  errorTitle: {
    ...scaleText({ fontSize: 18 }),
    fontWeight: "bold",
    color: colors.error,
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  errorText: {
    ...scaleText({ fontSize: 14 }),
    color: colors.onSurface,
    textAlign: "center",
    lineHeight: 20,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: hp(2),
  },
  countText: {
    ...scaleText({ fontSize: 36 }),
    fontWeight: "bold",
    color: colors.primary,
    marginTop: hp(1),
  },
  descriptionText: {
    ...scaleText({ fontSize: 16 }),
    color: colors.onSurface,
    textAlign: "center",
    marginTop: hp(1),
  },
  buttonContainer: {
    marginTop: hp(3),
    width: "100%",
  },
  closeButton: {
    borderRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(2),
  },
  modalIcon: {
    marginRight: wp(2),
  },
  modalTitle: {
    ...scaleText({ fontSize: 20 }),
    fontWeight: "bold",
    color: colors.onSurface,
    textAlign: "center",
  },
}));
