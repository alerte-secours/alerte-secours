import React, { useCallback, useState, useEffect } from "react";

import { View } from "react-native";
import LittleLoader from "~/components/LittleLoader";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@apollo/client";

import Text from "~/components/Text";
import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";

import SmsDisclaimerModal from "~/containers/SmsDisclaimerModel";

import { useSessionState, authActions } from "~/stores";

import { useStyles } from "./styles";
import useSendAuthSMS from "~/hooks/useSendAuthSMS";
import { useTheme } from "~/theme";
import { DELETE_LOGIN_REQUEST_MUTATION, LOGIN_CONFIRM_MUTATION } from "./gql";

import ConnectViaEmail from "./ConnectViaEmail";
import isConnectedProfile from "./isConnectedProfile";

import { getDeviceUuid } from "~/auth/deviceUuid";

import { announceForA11yIfScreenReaderEnabled } from "~/lib/a11y";

export default function AccountManagementModalConnect({
  closeModal,
  profileData,
  authMethod,
  setAuthMethod,
  waitingSmsType,
  clearAuthWaitParams,
}) {
  const styles = useStyles();
  const { colors, custom } = useTheme();
  const isConnected = isConnectedProfile(profileData);

  const [isLoading, setIsLoading] = useState(false);
  const sendAuthSMS = useSendAuthSMS();

  const loginRequest = profileData.selectOneUser.oneUserLoginRequest;

  // Show loader when component mounts if waiting for connect SMS and no login request yet
  useEffect(() => {
    if (waitingSmsType === "C" && !loginRequest) {
      setIsLoading(true);
    }
  }, [waitingSmsType, loginRequest]);

  // Clear loading state after 3 minutes or when login request is received
  useEffect(() => {
    let timeout;
    if (isLoading) {
      // Clear loading when login request is received
      if (loginRequest) {
        setIsLoading(false);
      } else {
        // Set timeout for 3 minutes if no login request
        timeout = setTimeout(
          () => {
            setIsLoading(false);
          },
          3 * 60 * 1000,
        ); // 3 minutes
      }
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isLoading, loginRequest]);

  const connectUsingPhoneNumber = () => {
    setIsLoading(true);
    sendAuthSMS({
      smsType: "C",
      body: "Se connecter sur Alerte-Secours:\nCode: [CODE]\n💙", // must don't exceed 160 chars including replaced [CODE]
    });
  };

  const smsDisclaimerModalStatePair = useState({ visible: false });
  const [, setSmsDisclaimerModalState] = smsDisclaimerModalStatePair;
  const smsDisclaimerOk = () => {
    connectUsingPhoneNumber();
  };

  const connectUsingEmail = useCallback(async () => {
    setAuthMethod("email");
  }, [setAuthMethod]);

  const [deleteLoginRequest] = useMutation(DELETE_LOGIN_REQUEST_MUTATION);
  const [loginConfirmRequest] = useMutation(LOGIN_CONFIRM_MUTATION);

  const confirmLoginRequest = useCallback(async () => {
    try {
      const deviceUuid = await getDeviceUuid();
      const {
        data: {
          doAuthLoginConfimLoginRequest: { authTokenJwt },
        },
      } = await loginConfirmRequest({
        variables: { loginRequestId: loginRequest.id, deviceUuid },
      });
      await authActions.confirmLoginRequest({ authTokenJwt, isConnected });
      setIsLoading(false);
      clearAuthWaitParams?.();
      closeModal();
    } catch (e) {
      setIsLoading(false);
      announceForA11yIfScreenReaderEnabled(
        "Erreur lors de la confirmation de connexion",
      );
    }
  }, [
    loginConfirmRequest,
    loginRequest?.id,
    isConnected,
    clearAuthWaitParams,
    closeModal,
  ]);

  const rejectLoginRequest = useCallback(async () => {
    try {
      await deleteLoginRequest({ variables: { id: loginRequest.id } });
    } finally {
      setIsLoading(false);
      clearAuthWaitParams?.();
      closeModal();
    }
  }, [deleteLoginRequest, loginRequest?.id, clearAuthWaitParams, closeModal]);

  return (
    <View
      style={{
        flexDirection: "column",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          Se connecter à un compte
        </Text>
      </View>
      <View style={{ marginVertical: 10 }}>
        {loginRequest && (
          <View
            style={{
              borderTopWidth: 0.6,
              borderBottomWidth: 0.6,
              borderColor: colors.grey,
              paddingVertical: 20,
              marginVertical: 25,
            }}
          >
            <View
              onPress={() => {}}
              style={{
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    paddingLeft: 10,
                  }}
                >
                  Connexion via
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                {loginRequest?.type === "phone_number" && (
                  <PhoneNumberReadOnly
                    phoneNumber={loginRequest.onePhoneNumber.number}
                    phoneCountry={loginRequest.onePhoneNumber.country}
                  />
                )}
                {loginRequest?.type === "email" && (
                  <View>
                    <Text style={{ fontWeight: "bold" }}>
                      {loginRequest?.oneEmail.email}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: "row", width: "100%" }}>
              <Button
                mode="contained"
                onPress={confirmLoginRequest}
                style={{
                  flex: 1,
                  backgroundColor: colors.ok,
                  borderRadius: 4,
                  marginHorizontal: 5,
                }}
              >
                Confirmer
              </Button>
              <Button
                mode="contained"
                onPress={rejectLoginRequest}
                style={{
                  flex: 1,
                  backgroundColor: colors.no,
                  borderRadius: 4,
                  marginHorizontal: 5,
                }}
              >
                Rejeter
              </Button>
            </View>
          </View>
        )}
      </View>

      {authMethod === "email" && (
        <View
          style={{
            flex: 1,
          }}
        >
          <ConnectViaEmail />
        </View>
      )}

      {!authMethod && (
        <>
          {isLoading && (
            <View style={{ alignItems: "center", marginBottom: 15 }}>
              <LittleLoader
                style={{ height: 64, width: 64, marginBottom: 10 }}
              />
              <Text style={{ textAlign: "center", fontSize: 14 }}>
                En attente de réception du SMS...
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              flex: 1,
            }}
          >
            <Button
              onPress={() => {
                setSmsDisclaimerModalState({ visible: true, action: "C" });
              }}
              mode="contained"
              style={{
                flex: 1,
                justifyContent: "center",
                marginRight: 10,
              }}
              contentStyle={{
                height: 60,
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name="phone"
                  size={22}
                  style={styles.buttonIcon}
                />
              )}
            >
              Par SMS
            </Button>
            <Button
              onPress={() => connectUsingEmail()}
              mode="contained"
              style={{ flex: 1, justifyContent: "center" }}
              contentStyle={{
                height: 60,
              }}
              icon={() => (
                <MaterialCommunityIcons
                  name="email"
                  size={22}
                  style={styles.buttonIcon}
                />
              )}
            >
              Par email
            </Button>
          </View>
        </>
      )}
      <View style={{ flexDirection: "column", flex: 1, paddingTop: 15 }}>
        <Button
          onPress={() => closeModal()}
          mode="outlined"
          style={{
            flex: 1,
            justifyContent: "center",
          }}
          contentStyle={{
            height: 60,
          }}
        >
          Annuler
        </Button>
      </View>
      <SmsDisclaimerModal
        modalState={smsDisclaimerModalStatePair}
        action={smsDisclaimerOk}
      />
    </View>
  );
}
