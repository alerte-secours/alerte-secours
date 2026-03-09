import { useCallback } from "react";

import { View } from "react-native";

import { Button } from "react-native-paper";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@apollo/client";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";

import { useTheme } from "~/theme";

import { ACCEPT_INVATION_MUTATION, DELETE_INVITATION_MUTATION } from "./gql";

export default function InvitationContactPhoneNumber({ row }) {
  const { colors } = useTheme();

  const {
    id: relativeInvitationId,
    oneUserPhoneNumberRelative: {
      onePhoneNumber: {
        // id: phoneNumberId,
        country: fromPhoneCountry,
        number: fromPhoneNumber,
      },
    },
  } = row;

  const [acceptInvitationMutation] = useMutation(ACCEPT_INVATION_MUTATION);
  const [deleteInvitation] = useMutation(DELETE_INVITATION_MUTATION, {
    variables: {
      relativeInvitationId,
    },
  });

  // const [acceptInvitationMessage, setAcceptInvitationMessage] = useState("");

  const acceptInvitation = useCallback(async () => {
    await acceptInvitationMutation({
      variables: {
        relativeInvitationId,
      },
    });
  }, [acceptInvitationMutation, relativeInvitationId]);

  const refuseInvitation = useCallback(async () => {
    await deleteInvitation();
  }, [deleteInvitation]);

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
          phoneNumber={fromPhoneNumber}
          phoneCountry={fromPhoneCountry}
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
          mode="contained"
          style={{ backgroundColor: colors.ok, marginHorizontal: 3 }}
          icon={() => (
            <MaterialIcons
              name="check-circle"
              size={22}
              color={colors.onPrimary}
            />
          )}
          onPress={acceptInvitation}
        >
          Accepter
        </Button>
        <Button
          mode="contained"
          style={{ backgroundColor: colors.no, marginHorizontal: 3 }}
          icon={() => (
            <MaterialCommunityIcons
              name="close-circle"
              size={22}
              color={colors.onPrimary}
            />
          )}
          onPress={refuseInvitation}
        >
          Refuser
        </Button>
      </View>
      {/* {acceptInvitationMessage && (
        <View>
          <Text style={{ fontSize: 16, color: colors.error }}>
            {acceptInvitationMessage}
          </Text>
        </View>
      )} */}
    </View>
  );
}
