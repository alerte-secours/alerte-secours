import React, { useState, useCallback } from "react";
import { View } from "react-native";

import { useTheme } from "~/theme";

import Text from "~/components/Text";

import { Button } from "react-native-paper";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";

import useSendAuthSMS from "~/hooks/useSendAuthSMS";

import SmsDisclaimerModal from "~/containers/SmsDisclaimerModel";

export default function DisabledFeature() {
  const smsDisclaimerModalStatePair = useState({ visible: false });
  const [, setSmsDisclaimerModalState] = smsDisclaimerModalStatePair;
  const smsDisclaimerOk = () => {
    if (smsDisclaimerModalStatePair[0].action === "R") {
      registerPhoneNumber();
    } else {
      connectUsingPhoneNumber();
    }
  };
  const sendAuthSMS = useSendAuthSMS();

  const navigation = useNavigation();

  const registerPhoneNumber = useCallback(async () => {
    navigation.dispatch({
      ...CommonActions.navigate({
        name: "Profile",
        params: { waitingSmsType: "R" },
      }),
    });

    sendAuthSMS({
      smsType: "R",
      body: "S'enregistrer sur Alerte-Secours:\nCode: [CODE]\n💙", // must don't exceed 160 chars including replaced [CODE]
    });
  }, [navigation, sendAuthSMS]);

  const connectUsingPhoneNumber = useCallback(async () => {
    navigation.dispatch({
      ...CommonActions.navigate({
        name: "Profile",
        params: { openAccountModal: true, waitingSmsType: "C" },
      }),
    });

    sendAuthSMS({
      smsType: "C",
      body: "Se connecter sur Alerte-Secours:\nCode: [CODE]\n💙", // must don't exceed 160 chars including replaced [CODE]
    });
  }, [navigation, sendAuthSMS]);

  const { colors, custom } = useTheme();
  return (
    <>
      <SmsDisclaimerModal
        modalState={smsDisclaimerModalStatePair}
        action={smsDisclaimerOk}
      />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            width: "auto",
            textAlign: "center",
            padding: 15,
            fontSize: 18,
          }}
        >
          {`Vous devez enregistrer un numéro de téléphone pour pouvoir utiliser cette fonctionnalité.`}
        </Text>
        <View style={{ padding: 15 }}>
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
          >
            Enregistrer mon numéro de téléphone
          </Button>
          <Button
            key="login-button"
            mode="contained"
            onPress={() =>
              setSmsDisclaimerModalState({ visible: true, action: "C" })
            }
            icon={() => (
              <MaterialCommunityIcons
                name="account-key"
                size={22}
                color={colors.onPrimary}
              />
            )}
            style={{
              marginHorizontal: 0,
              borderRadius: 4,
              height: 45,
              marginTop: 15,
              justifyContent: "center",
            }}
          >
            Se connecter
          </Button>
        </View>
        <Text
          style={{
            width: "auto",
            textAlign: "center",
            padding: 15,
            fontSize: 18,
          }}
        >
          {`Vous pourrez retrouver votre numéro sur votre profil.`}
        </Text>
        <Button
          mode="contained"
          icon={() => (
            <MaterialIcons name="face" size={22} color={colors.onPrimary} />
          )}
          uppercase={true}
          onPress={() => {
            navigation.navigate("Profile");
          }}
        >
          Mon Profil
        </Button>
      </View>
    </>
  );
}
