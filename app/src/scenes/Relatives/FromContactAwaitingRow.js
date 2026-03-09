import { useCallback } from "react";

import { View } from "react-native";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";
import { useTheme } from "~/theme";

import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useMutation } from "@apollo/client";

import { Button } from "react-native-paper";

import { ALLOW_FROM_NUMBER_MUTATION, DENY_FROM_NUMBER_MUTATION } from "./gql";

export default function FromContactAwaitingRow({ oneRelativeAsTo }) {
  const { colors, custom } = useTheme();

  const {
    oneViewRelativePhoneNumber: {
      onePhoneNumber: { country: phoneCountry, number: phoneNumber },
    },
    oneRelativeAllow: { id: relativeAllowId },
  } = oneRelativeAsTo;

  // const [errorMessage, setErrorMessage] = useState(null);

  const [allowFromNumberMutation] = useMutation(ALLOW_FROM_NUMBER_MUTATION, {
    variables: { relativeAllowId },
  });

  const [denyFromNumberMutation] = useMutation(DENY_FROM_NUMBER_MUTATION, {
    variables: { relativeAllowId },
  });

  const allowFromNumber = useCallback(async () => {
    await allowFromNumberMutation();
  }, [allowFromNumberMutation]);

  const denyFromNumber = useCallback(async () => {
    await denyFromNumberMutation();
  }, [denyFromNumberMutation]);

  return (
    <View
      style={{
        alignItems: "center",
        borderBottomColor: "rgba(0, 0, 0, 0.12)",
        borderBottomWidth: 0.2,
        paddingBottom: 10,
      }}
    >
      <View>
        <PhoneNumberReadOnly
          phoneNumber={phoneNumber}
          phoneCountry={phoneCountry}
          useContactName
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Button
          key="allow"
          mode="contained"
          style={{ backgroundColor: colors.ok, marginHorizontal: 3 }}
          icon={() => (
            <MaterialIcons
              name="check-circle"
              size={22}
              color={colors.onPrimary}
            />
          )}
          onPress={allowFromNumber}
        >
          Autoriser
        </Button>

        <Button
          key="deny"
          mode="contained"
          style={{ backgroundColor: colors.no, marginHorizontal: 3 }}
          icon={() => (
            <MaterialCommunityIcons
              name="close-circle"
              size={22}
              color={colors.onPrimary}
            />
          )}
          onPress={denyFromNumber}
        >
          Bloquer
        </Button>
      </View>
      {/* {errorMessage && (
        <View>
          <Text style={{ fontSize: 16, color: colors.error }}>
            {errorMessage}
          </Text>
        </View>
      )} */}
    </View>
  );
}
