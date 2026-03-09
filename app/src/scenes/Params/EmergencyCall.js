import { useCallback, useState, useRef, useEffect } from "react";
import { View } from "react-native";
import { useMutation } from "@apollo/client";
import { Title, RadioButton } from "react-native-paper";
import { useSessionState, paramsActions } from "~/stores";

import { createStyles } from "~/theme";
import Text from "~/components/Text";

import { DEVICE_PREFERRED_EMERGENCY_CALL_MUTATION } from "./gql";

export default function ParamsEmergencyCall({ data }) {
  const { deviceId } = useSessionState(["deviceId"]);
  const [devicePreferredEmergencyCallMutation] = useMutation(
    DEVICE_PREFERRED_EMERGENCY_CALL_MUTATION,
  );

  const preferredEmergencyCall =
    data.selectOneDevice.preferredEmergencyCall || "voice";

  const setPreferredEmergencyCall = useCallback(
    async (preferredEmergencyCall) => {
      paramsActions.setPreferredEmergencyCall(preferredEmergencyCall);
      await devicePreferredEmergencyCallMutation({
        variables: {
          deviceId,
          preferredEmergencyCall,
        },
      });
    },
    [devicePreferredEmergencyCallMutation, deviceId],
  );

  const styles = useStyles();

  return (
    <>
      <Title accessibilityRole="header" style={styles.title}>
        Préférences d'accessibilité
      </Title>
      <View style={styles.box}>
        <Text style={styles.label}>
          Lors des appels aux services de secours
        </Text>
        <View style={styles.radioGroup}>
          <RadioButton.Group
            onValueChange={(newValue) => setPreferredEmergencyCall(newValue)}
            value={preferredEmergencyCall}
          >
            <RadioButton.Item
              style={[styles.radioItem]}
              labelStyle={[styles.radioItemLabel]}
              label="Appeler le 112"
              value="voice"
            />
            <RadioButton.Item
              style={[styles.radioItem]}
              labelStyle={[styles.radioItemLabel]}
              label="Envoyer un SMS au 114, numéro d’urgence pour les personnes sourdes et malentendantes (nécessite une validation manuelle)"
              value="sms"
            />
          </RadioButton.Group>
        </View>
      </View>
    </>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
  },
  box: { flexDirection: "column", width: "100%" },
  radioGroup: {},
  radioItem: {
    borderWidth: 1,
    borderRadius: 2,
    marginVertical: 5,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  radioItemLabel: { fontSize: 18 },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    paddingBottom: 15,
    textAlign: "center",
  },
}));
