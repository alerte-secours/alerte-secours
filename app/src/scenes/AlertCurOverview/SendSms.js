import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAlertState, useSessionState } from "~/stores";

import Text from "~/components/Text";
import { MANY_RELATIVE_QUERY } from "./gql";
import useStyles from "./styles";

import { useQuery } from "@apollo/client";
import { normalizeNumber } from "~/utils/phone";
import useSendAlertSMS from "~/hooks/useSendAlertSMS";
import useSendAlertSMSToEmergency from "~/hooks/useSendAlertSMSToEmergency";

export default function SendSms() {
  const styles = useStyles();
  const { navAlertCur } = useAlertState(["navAlertCur"]);
  const { alert } = navAlertCur;

  const { userId: sessionUserId } = useSessionState(["userId"]);

  const { data } = useQuery(MANY_RELATIVE_QUERY, {
    variables: { userId: sessionUserId },
  });

  const sendSMS = useSendAlertSMS();
  const sendSMSToEmergency = useSendAlertSMSToEmergency();

  const { notifyRelatives } = alert;

  const hasRelativeNotEnabled = useMemo(
    () =>
      data?.selectManyRelative.some(
        ({ oneRelativeAllow }) =>
          !(oneRelativeAllow && oneRelativeAllow.allowed),
      ),
    [data],
  );

  const sendSmsToRelative = useCallback(async () => {
    const recipients = [];
    if (data) {
      for (const row of data.selectManyRelative) {
        const {
          oneViewRelativePhoneNumber: {
            onePhoneNumberAsTo: { country: phoneCountry, number: phoneNumber },
          },
        } = row;
        const fullPhoneNumber = normalizeNumber(phoneNumber, phoneCountry);
        recipients.push(fullPhoneNumber);
      }
      for (const row of data.selectManyRelativeUnregistered) {
        const { phoneCountry, phoneNumber } = row;
        const fullPhoneNumber = normalizeNumber(phoneNumber, phoneCountry);
        recipients.push(fullPhoneNumber);
      }
    }

    await sendSMS({ recipients, alert });
  }, [data, sendSMS, alert]);

  return (
    <View>
      {notifyRelatives && hasRelativeNotEnabled && (
        <View style={[styles.actionContainer, styles.actionSmsInfoTip]}>
          <Text style={[styles.actionText, styles.actionSmsInfoTipText]}>
            Certains contacts d'urgence ne vous ont pas autorisé à les contacter
            via l'app.
          </Text>
          <Text style={[styles.actionText, styles.actionSmsInfoTipText]}>
            Utilisez le bouton ci-dessous pour les prévenir
          </Text>
        </View>
      )}
      <View style={[styles.actionContainer, styles.actionSms]}>
        <Button
          mode="contained"
          icon={() => (
            <MaterialCommunityIcons
              name="message-arrow-right-outline"
              style={[styles.actionIcon, styles.actionSmsIcon]}
            />
          )}
          style={[styles.actionButton, styles.actionSmsButton]}
          onPress={sendSmsToRelative}
        >
          <Text style={[styles.actionText, styles.actionSmsText]}>
            Envoyer un SMS à vos proches
          </Text>
        </Button>
      </View>
      <View style={[styles.actionContainer, styles.actionSms]}>
        <Button
          mode="contained"
          icon={() => (
            <MaterialCommunityIcons
              name="message-alert-outline"
              style={[styles.actionIcon, styles.actionSmsIcon]}
            />
          )}
          style={[styles.actionButton, styles.actionSmsButton]}
          onPress={() => sendSMSToEmergency({ alert })}
        >
          <Text style={[styles.actionText, styles.actionSmsText]}>
            Envoyer un SMS aux urgences
          </Text>
        </Button>
      </View>
    </View>
  );
}
