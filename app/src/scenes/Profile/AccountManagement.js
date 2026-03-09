import React, { useState, useCallback, useEffect, useRef } from "react";

import { View } from "react-native";

import { Button } from "react-native-paper";

import Text from "~/components/Text";

import { useTheme } from "~/theme";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import AccountManagementModal from "./AccountManagementModal";

import { authActions, useParamsState } from "~/stores";
import isConnectedProfile from "./isConnectedProfile";

import AccountManagementDev from "./AccountManagementDev";

export default function AccountManagement({
  profileData,
  openAccountModal,
  waitingSmsType,
  clearAuthWaitParams,
}) {
  const { colors, custom } = useTheme();
  const isConnected = isConnectedProfile(profileData);

  const { devModeEnabled } = useParamsState(["devModeEnabled"]);
  const isDev = devModeEnabled;

  const modalState = useState({ visible: openAccountModal || false });
  const [, setModal] = modalState;

  const openConnectButtonRef = useRef(null);
  const openDestroyButtonRef = useRef(null);

  const openModal = useCallback(
    (options = {}) => {
      setModal({ visible: true, ...options });
    },
    [setModal],
  );

  const openModalConnect = useCallback(() => {
    openModal({
      component: "connect",
    });
  }, [openModal]);

  const loginRequest = profileData.selectOneUser.oneUserLoginRequest;
  useEffect(() => {
    if (loginRequest) {
      openModal({
        component: "connect",
      });
    }
  }, [loginRequest, openModal, openAccountModal]);

  useEffect(() => {
    if (openAccountModal) {
      openModalConnect();
    }
  }, [openAccountModal, openModalConnect]);

  const logoutUser = async () => {
    await authActions.logout();
  };

  const openModalDestroy = async () => {
    openModal({
      component: "destroy",
    });
  };

  return (
    <View>
      <View>
        <Text style={{ fontSize: 16 }}>Gestion du compte</Text>
      </View>
      <View style={{ marginVertical: 10 }}>
        <Button
          ref={openConnectButtonRef}
          mode="contained"
          style={{ marginVertical: 5 }}
          icon={() => (
            <MaterialCommunityIcons
              name="account-switch-outline"
              size={28}
              color={colors.onPrimary}
            />
          )}
          labelStyle={{
            flex: 1,
          }}
          onPress={openModalConnect}
        >
          {isConnected ? "Changer de compte" : "Se connecter"}
        </Button>
        {(isConnected || isDev) && (
          <Button
            mode="contained"
            style={{ marginVertical: 5 }}
            labelStyle={{
              flex: 1,
            }}
            icon={() => (
              <MaterialCommunityIcons
                name="logout"
                size={28}
                color={colors.onPrimary}
              />
            )}
            onPress={() => logoutUser()}
          >
            Se Déconnecter
          </Button>
        )}

        <Button
          ref={openDestroyButtonRef}
          mode="contained"
          style={{ marginVertical: 5, backgroundColor: custom.appColors.red }}
          accessibilityLabel="Supprimer le compte"
          accessibilityHint="Action irréversible. Ouvre une confirmation de suppression du compte"
          labelStyle={{
            flex: 1,
          }}
          icon={() => (
            <MaterialCommunityIcons
              name="close-octagon"
              // name="account-remove"
              // name="account-off"
              size={28}
              color={colors.onPrimary}
            />
          )}
          onPress={() => openModalDestroy()}
        >
          Supprimer le compte
        </Button>
        <AccountManagementDev openModal={openModal} />
      </View>
      <AccountManagementModal
        modalState={modalState}
        profileData={profileData}
        waitingSmsType={waitingSmsType}
        clearAuthWaitParams={clearAuthWaitParams}
        triggerRefs={{
          connect: openConnectButtonRef,
          destroy: openDestroyButtonRef,
        }}
      />
    </View>
  );
}
