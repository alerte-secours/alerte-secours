import React, { useState, useEffect, useCallback } from "react";

import { View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Button, IconButton } from "react-native-paper";

import { useMutation } from "@apollo/client";

import { useTheme } from "~/theme";
import LittleLoader from "~/components/LittleLoader";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";

import PhoneNumberToggleIsPrivate from "./PhoneNumberToggleIsPrivate";

import PhoneNumberModalDelete from "./PhoneNumberModalDelete";
import PhoneNumberModalUpdateIsPrivate from "./PhoneNumberModalUpdateIsPrivate";
import SmsDisclaimerModal from "~/containers/SmsDisclaimerModel";

import {
  REMOVE_PHONE_NUMBER_MUTATION,
  UPDATE_PHONE_NUMBER_ISPRIVATE_MUTATION,
} from "./gql";

import useSendAuthSMS from "~/hooks/useSendAuthSMS";

export default function PhoneNumbersView({
  data,
  waitingSmsType,
  clearAuthWaitParams,
}) {
  const [isLoading, setIsLoading] = useState(waitingSmsType === "R" || false);
  const phoneNumberList = data.selectOneUser.manyPhoneNumber;

  const { colors, custom } = useTheme();

  const [removePhoneNumberMutation] = useMutation(REMOVE_PHONE_NUMBER_MUTATION);

  const [updatePhoneNumberIsPrivateMutation] = useMutation(
    UPDATE_PHONE_NUMBER_ISPRIVATE_MUTATION,
  );
  const sendAuthSMS = useSendAuthSMS();

  const registerPhoneNumber = useCallback(async () => {
    setIsLoading(true);
    sendAuthSMS({
      smsType: "R",
      body: "S'enregistrer sur Alerte-Secours:\nCode: [CODE]\n💙", // must don't exceed 160 chars including replaced [CODE]
    });
  }, [sendAuthSMS, setIsLoading]);

  // Clear loading state after 3 minutes
  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(
        () => {
          setIsLoading(false);
        },
        3 * 60 * 1000,
      ); // 3 minutes
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isLoading]);

  // Clear loading state when login request is received
  useEffect(() => {
    if (data.selectOneUser.oneUserLoginRequest) {
      setIsLoading(false);
      clearAuthWaitParams?.();
    }
  }, [data.selectOneUser.oneUserLoginRequest, clearAuthWaitParams]);

  // Defensive cleanup on unmount to ensure no lingering loader
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  const deletePhoneNumberModalStatePair = useState({ visible: false });
  const [deletePhoneNumberModalState, setDeletePhoneNumberModalState] =
    deletePhoneNumberModalStatePair;
  const deletePhoneNumberModal = useCallback(
    (field) => {
      setDeletePhoneNumberModalState({
        field,
        visible: true,
      });
    },
    [setDeletePhoneNumberModalState],
  );

  const closeDeletePhoneNumberModal = useCallback(() => {
    setDeletePhoneNumberModalState({
      visible: false,
    });
  }, [setDeletePhoneNumberModalState]);

  const updatePhoneNumberModalStatePair = useState({ visible: false });
  const [updatePhoneNumberModalState, setUpdatePhoneNumberModalState] =
    updatePhoneNumberModalStatePair;

  const updatePhoneNumberModal = useCallback(
    (field) => {
      setUpdatePhoneNumberModalState({
        field,
        visible: true,
      });
    },
    [setUpdatePhoneNumberModalState],
  );

  const closeUpdatePhoneNumberModal = useCallback(() => {
    setUpdatePhoneNumberModalState({
      visible: false,
    });
  }, [setUpdatePhoneNumberModalState]);

  const deletePhoneNumber = useCallback(async () => {
    const { field } = deletePhoneNumberModalState;
    await removePhoneNumberMutation({ variables: { id: field.id } });
    closeDeletePhoneNumberModal();
  }, [
    deletePhoneNumberModalState,
    removePhoneNumberMutation,
    closeDeletePhoneNumberModal,
  ]);

  const updatePhoneNumberIsPrivate = useCallback(async () => {
    const { field } = updatePhoneNumberModalState;
    const newValue = !field.isPrivate;
    await updatePhoneNumberIsPrivateMutation({
      variables: { id: field.id, isPrivate: newValue },
    });
    closeUpdatePhoneNumberModal();
  }, [
    updatePhoneNumberModalState,
    updatePhoneNumberIsPrivateMutation,
    closeUpdatePhoneNumberModal,
  ]);

  const smsDisclaimerModalStatePair = useState({ visible: false });
  const [, setSmsDisclaimerModalState] = smsDisclaimerModalStatePair;
  const smsDisclaimerOk = useCallback(() => {
    registerPhoneNumber(true);
  }, [registerPhoneNumber]);

  return (
    <>
      <PhoneNumberModalDelete
        modalState={deletePhoneNumberModalStatePair}
        action={deletePhoneNumber}
      />
      <PhoneNumberModalUpdateIsPrivate
        modalState={updatePhoneNumberModalStatePair}
        action={updatePhoneNumberIsPrivate}
      />
      <SmsDisclaimerModal
        modalState={smsDisclaimerModalStatePair}
        action={smsDisclaimerOk}
      />
      <View
        style={{
          paddingBottom: 20,
        }}
      >
        {/* <View>
          <Text style={{ fontSize: 16 }}>{`Numéro${
            phoneNumberList.length > 1 ? "s" : ""
          } de téléphone`}</Text>
        </View> */}
        <View
          style={{
            flex: 1,
            width: "100%",
          }}
        >
          {phoneNumberList.map((field) => {
            const { country: phoneCountry, number: phoneNumber } = field;
            // const deleteDisabled = !!field.oneUserPhoneNumberRelative;
            return (
              <View
                key={field.id}
                style={{
                  flexDirection: "row",
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottomColor: "rgba(0, 0, 0, 0.12)",
                      borderBottomWidth: 0.2,
                      paddingBottom: 10,
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <PhoneNumberReadOnly
                        phoneNumber={phoneNumber}
                        phoneCountry={phoneCountry}
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                        }}
                      >
                        <PhoneNumberToggleIsPrivate
                          field={field}
                          action={() => updatePhoneNumberModal(field)}
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                          alignSelf: "flex-end",
                        }}
                      >
                        <IconButton
                          // disabled={deleteDisabled}
                          size={14}
                          style={{
                            backgroundColor: colors.no,
                          }}
                          icon={() => (
                            <MaterialCommunityIcons
                              name="close"
                              size={22}
                              color={colors.onPrimary}
                            />
                          )}
                          onPress={() => deletePhoneNumberModal(field)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
                {/* <TouchableRipple
                  disabled={index === 0}
                  compact
                  style={{
                    justifyContent: "center",
                    paddingHorizontal: 10,
                  }}
                  labelStyle={{ paddingRight: 0 }}
                  onPress={() => remove(index)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={28}
                    style={{}}
                    color={colors.primary}
                  />
                </TouchableRipple> */}
              </View>
            );
          })}

          <Button
            key="enable-add-phone-number"
            mode="contained"
            onPress={() =>
              setSmsDisclaimerModalState({ visible: true, action: "R" })
            }
            icon={() => (
              <MaterialCommunityIcons
                name="card-account-phone"
                size={22}
                color={colors.onPrimary}
              />
            )}
            style={{
              marginHorizontal: 0,
              borderRadius: 4,
              height: 45,
              marginTop: 5,
              justifyContent: "center",
            }}
            contentStyle={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            loading={isLoading}
          >
            {phoneNumberList.length > 0
              ? "Ajouter un numéro de téléphone"
              : "Enregistrer mon numéro de téléphone"}
          </Button>
        </View>
      </View>
    </>
  );
}
