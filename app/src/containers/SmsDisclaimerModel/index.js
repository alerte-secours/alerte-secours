import React from "react";

import { View } from "react-native";

import { Button, Portal, Modal } from "react-native-paper";

import Text from "~/components/Text";
import { useTheme } from "~/theme";

const actionsLabels = {
  R: "d'enregistrer votre numéro de téléphone",
  C: "de vous connecter",
};

export default function SmsDisclaimerModal({ modalState, action }) {
  const [smsDisclaimerModalState, setSmsDisclaimerModalState] = modalState;

  const closeSmsDisclaimerModal = () => {
    setSmsDisclaimerModalState({
      visible: false,
    });
  };

  const { visible, action: actionType } = smsDisclaimerModalState;

  const styles = {
    textBlock: { paddingVertical: 5 },
    text: { textAlign: "left", fontSize: 18 },
    textEmphasis: { fontWeight: "bold" },
  };

  const actionLabel = actionsLabels[actionType];

  const { colors } = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={closeSmsDisclaimerModal}
        contentContainerStyle={{ backgroundColor: colors.surface, padding: 20 }}
      >
        <>
          <View style={styles.textBlock}>
            <Text style={styles.text}>
              Afin {actionLabel} sur Alerte-Secours,
            </Text>
            <Text style={[styles.text, styles.textEmphasis]}>
              merci d'envoyer le SMS prérempli qui va s'ouvrir.
            </Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.text}>
              Une fois le SMS envoyé, la validation sera prise en compte dans
              quelques instants.
            </Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.text}>
              L'envoi est sans frais supplémentaires, hors coût standard d'un
              SMS selon votre opérateur.
            </Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.text}>
              Merci pour votre confiance et votre participation 💙
            </Text>
          </View>
        </>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            paddingTop: 20,
          }}
        >
          <Button
            onPress={() => {
              closeSmsDisclaimerModal();
              action();
            }}
            mode="outlined"
          >
            OK, j'envoie le SMS
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
