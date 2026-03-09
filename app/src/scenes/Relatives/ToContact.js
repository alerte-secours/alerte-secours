import React, { useCallback, useMemo, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { TouchableRipple } from "react-native-paper";
import ModalSelector from "react-native-modal-selector";
import { useMutation } from "@apollo/client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ToContactPhoneNumberList from "./ToContactPhoneNumberList";
import InvitationContactPhoneNumber from "./InvitationContactPhoneNumber";

import { useForm, FormProvider } from "react-hook-form";
import useDeviceCountryCode from "~/hooks/useDeviceCountryCode";
import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";
import { useTheme } from "~/theme";
import RelativeModalDelete from "./RelativeModalDelete";

import useStylesCommon from "./styles";
import {
  UPSERT_USER_PHONE_NUMBER_RELATIVE_MUTATION,
  REMOVE_RELATIVE_MUTATION,
  REMOVE_RELATIVE_UNREGISTERED_MUTATION,
} from "./gql";

export default function ToContact({ data }) {
  const {
    selectOneUser: {
      manyRelative,
      manyPhoneNumber,
      manyRelativeInvitationAsTo,
      oneUserPhoneNumberRelative,
    },
  } = data;

  const commonStyles = useStylesCommon();

  const { colors, custom } = useTheme();

  const defaultCountryCode = useDeviceCountryCode();

  const formMethods = useForm({
    mode: "onTouched",
    defaultValues: {
      userPhoneNumberRelative:
        oneUserPhoneNumberRelative?.onePhoneNumber || manyPhoneNumber[0],
      new: {
        phoneCountry: defaultCountryCode,
        phoneNumber: "",
      },
    },
  });
  const { watch, setValue } = formMethods;

  const userPhoneNumberRelative = watch("userPhoneNumberRelative");

  const [
    isSelectingUserPhoneNumberRelative,
    setIsSelectingUserPhoneNumberRelative,
  ] = useState(false);

  const [upsertUserPhoneNumberRelative] = useMutation(
    UPSERT_USER_PHONE_NUMBER_RELATIVE_MUTATION,
  );

  const [removeRelativeMutation] = useMutation(REMOVE_RELATIVE_MUTATION);
  const [removeRelativeUnregisteredMutation] = useMutation(
    REMOVE_RELATIVE_UNREGISTERED_MUTATION,
  );
  const deleteRelativeModalStatePair = useState({ visible: false });
  const [deleteRelativeModalState, setDeleteRelativeModalState] =
    deleteRelativeModalStatePair;
  const deleteRelativeModal = (field) => {
    setDeleteRelativeModalState({
      field,
      visible: true,
    });
  };
  const closeDeleteRelativeModal = () => {
    setDeleteRelativeModalState({
      visible: false,
    });
  };
  const deleteRelative = async () => {
    const { field } = deleteRelativeModalState;
    switch (field.type) {
      case "registered":
        await removeRelativeMutation({ variables: { id: field.id } });
        break;
      case "unregistered":
        await removeRelativeUnregisteredMutation({
          variables: { id: field.id },
        });
        break;
    }
    closeDeleteRelativeModal();
  };

  return (
    <View>
      <FormProvider {...formMethods}>
        {manyPhoneNumber.length > 1 && (
          <View key="select-relative-phone-number">
            <View style={{ flexDirection: "row" }}>
              <MaterialCommunityIcons
                name="cellphone-information"
                size={24}
                style={{ paddingRight: 10, color: colors.primary }}
              />
              <Text style={{ fontSize: 18, color: colors.primary, flex: 1 }}>
                Numéro de contact
              </Text>
            </View>
            <View style={{ marginVertical: 10 }}>
              <TouchableRipple
                onPress={() => setIsSelectingUserPhoneNumberRelative(true)}
                style={{
                  backgroundColor: colors.surface,
                  shadowColor: "rgba(0,0,0,0.4)",
                  shadowOffset: {
                    width: 1,
                    height: 5,
                  },
                  shadowOpacity: 0.34,
                  shadowRadius: 6.27,
                  elevation: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {userPhoneNumberRelative && (
                    <PhoneNumberReadOnly
                      phoneNumber={userPhoneNumberRelative.number}
                      phoneCountry={userPhoneNumberRelative.country}
                    />
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      height: "100%",
                      alignItems: "center",
                      marginHorizontal: 10,
                    }}
                  >
                    <MaterialCommunityIcons
                      // name="pencil-box-outline"
                      // name="pencil-circle-outline"
                      name="pencil"
                      size={22}
                    />
                  </View>
                </View>
              </TouchableRipple>
            </View>
          </View>
        )}
        {isSelectingUserPhoneNumberRelative && (
          <ModalSelector
            key="modal-number-select-relative"
            visible
            selectStyle={{ display: "none" }}
            data={[
              {
                key: "label",
                section: true,
                label: `Sélectionnez le numéro à utiliser par vos proches:`,
              },
              ...manyPhoneNumber.map((row, index) => ({
                key: index,
                value: row,
                component: (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <PhoneNumberReadOnly
                      phoneNumber={row.number}
                      phoneCountry={row.country}
                    />
                  </View>
                ),
              })),
            ]}
            cancelText="Annuler"
            onModalClose={() => {
              setIsSelectingUserPhoneNumberRelative(false);
            }}
            onChange={async (option) => {
              const { value } = option;
              setIsSelectingUserPhoneNumberRelative(false);
              setValue("userPhoneNumberRelative", value);
              await upsertUserPhoneNumberRelative({
                variables: { phoneNumberId: value.id },
              });
              // setModalNumberSelect(null);
            }}
          />
        )}
        {data && (
          <ToContactPhoneNumberList
            data={data}
            deleteRelativeModal={deleteRelativeModal}
          />
        )}
        <View>
          {manyRelativeInvitationAsTo.length > 0 && (
            <View style={commonStyles.subtitleContainer}>
              <View style={{ marginTop: 10, paddingBottom: 10 }}>
                <Text style={commonStyles.subtitleText}>
                  Propositions reçues en attente
                </Text>
              </View>
              <View>
                {manyRelativeInvitationAsTo.map((row, index) => (
                  <InvitationContactPhoneNumber key={index} row={row} />
                ))}
              </View>
            </View>
          )}
        </View>
      </FormProvider>
      <RelativeModalDelete
        modalState={deleteRelativeModalStatePair}
        action={deleteRelative}
      />
    </View>
  );
}
