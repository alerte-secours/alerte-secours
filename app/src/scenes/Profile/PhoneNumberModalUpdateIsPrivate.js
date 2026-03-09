import React from "react";

import { View } from "react-native";

import { Button, Portal, Modal } from "react-native-paper";

import Text from "~/components/Text";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";
import { useTheme } from "~/theme";

export default function PhoneNumberModalUpdateIsPrivate({
  modalState,
  action,
}) {
  const [updatePhoneNumberModalState, setUpdatePhoneNumberModalState] =
    modalState;

  const closeUpdatePhoneNumberModal = () => {
    setUpdatePhoneNumberModalState({
      visible: false,
    });
  };

  const { field, visible } = updatePhoneNumberModalState;

  const { colors } = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={closeUpdatePhoneNumberModal}
        contentContainerStyle={{ backgroundColor: colors.surface, padding: 20 }}
      >
        {field && (
          <>
            <Text>
              Vous êtes sur le point de{" "}
              {field.isPrivate ? "rendre publique" : "masquer"} le numéro de
              téléphone suivant:
            </Text>
            <View style={{ alignItems: "center" }}>
              <PhoneNumberReadOnly
                phoneNumber={field.number}
                phoneCountry={field.country}
              />
            </View>
          </>
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
            onPress={() => closeUpdatePhoneNumberModal()}
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
