import React, { useMemo } from "react";

import { View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";

import Text from "~/components/Text";
import { useRootNav } from "~/navigation/Context";
import { defibsActions, useDefibsState } from "~/stores";
import { useTheme } from "~/theme";

export default function DaeSuggestModal() {
  const { showDaeSuggestModal } = useDefibsState(["showDaeSuggestModal"]);
  const navigationRef = useRootNav();
  const { colors } = useTheme();

  const styles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.surface,
        padding: 20,
        marginHorizontal: 16,
        borderRadius: 12,
      },
      title: { fontSize: 20, fontWeight: "bold" },
      paragraph: { marginTop: 10, fontSize: 16 },
      actionsColumn: {
        marginTop: 18,
        gap: 10,
      },
    }),
    [colors.surface],
  );

  const dismiss = () => {
    defibsActions.setShowDaeSuggestModal(false);
  };

  const goToDaeList = () => {
    dismiss();

    // DAEList is inside the Drawer navigator which is the RootStack "Main" screen.
    // Using the root navigation ref makes this modal independent from current route.
    navigationRef?.current?.navigate("Main", {
      screen: "DAEList",
    });
  };

  return (
    <Portal>
      <Modal
        visible={!!showDaeSuggestModal}
        onDismiss={dismiss}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>Défibrillateur à proximité</Text>
        <Text style={styles.paragraph}>
          En cas d'arrêt cardiaque, un défibrillateur (DAE) à proximité peut
          sauver une vie.
        </Text>
        <View style={styles.actionsColumn}>
          <Button mode="contained" onPress={goToDaeList}>
            Chercher un défibrillateur
          </Button>
          <Button mode="outlined" onPress={dismiss}>
            Non merci
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
