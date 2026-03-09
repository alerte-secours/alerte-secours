import React from "react";

import { View } from "react-native";

import { Button, Portal, Modal } from "react-native-paper";

import Text from "~/components/Text";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";

import { useTheme } from "~/theme";

export default function RelativeModalDelete({ modalState, action }) {
  const [deletePhoneNumberModalState, setDeletePhoneNumberModalState] =
    modalState;

  const closeDeletePhoneNumberModal = () => {
    setDeletePhoneNumberModalState({
      visible: false,
    });
  };

  const { field, visible } = deletePhoneNumberModalState;

  const { colors } = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={closeDeletePhoneNumberModal}
        contentContainerStyle={{ backgroundColor: colors.surface, padding: 20 }}
      >
        <Text>
          Vous êtes sur le point de supprimer le numéro de téléphone suivant de
          vos contacts en cas d'urgence:
        </Text>
        {field && (
          <View style={{ alignItems: "center" }}>
            <PhoneNumberReadOnly
              phoneNumber={field.number}
              phoneCountry={field.country}
            />
          </View>
        )}
        <Text style={{ textAlign: "center" }}>Êtes-vous sûr ?</Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            paddingTop: 20,
          }}
        >
          <Button
            onPress={() => closeDeletePhoneNumberModal()}
            mode="outlined"
            // mode="contained"
            // style={{
            //   backgroundColor: colors.no,
            //   marginHorizontal: 3,
            // }}
            // labelStyle={{
            //   color: colors.surface,
            // }}
          >
            Annuler
          </Button>
          <Button
            onPress={action}
            mode="outlined"
            // mode="contained"
            // style={{
            //   backgroundColor: colors.ok,
            //   marginHorizontal: 3,
            // }}
            // labelStyle={{
            //   color: colors.surface,
            // }}
          >
            OK
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
