import React from "react";
import { Modal, SafeAreaView, StyleSheet } from "react-native";
import { usePermissionWizardState } from "~/stores";
import { useTheme } from "~/theme";

import Welcome from "./Welcome";
import HeroMode from "./HeroMode";
import Success from "./Success";
import SkipInfo from "./SkipInfo";

export default function PermissionWizard({ visible }) {
  const { currentStep } = usePermissionWizardState(["currentStep"]);
  const theme = useTheme();

  let StepComponent;
  switch (currentStep) {
    case "welcome":
      StepComponent = Welcome;
      break;
    case "hero":
    case "tracking":
      StepComponent = HeroMode;
      break;
    case "success":
      StepComponent = Success;
      break;
    case "skipInfo":
      StepComponent = SkipInfo;
      break;
    default:
      StepComponent = Welcome;
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={() => {}}
    >
      <SafeAreaView
        accessibilityViewIsModal
        accessibilityLabel="Assistant d'autorisations"
        accessibilityHint="Fenêtre modale. Suivez les étapes pour accorder les autorisations nécessaires."
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StepComponent />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
