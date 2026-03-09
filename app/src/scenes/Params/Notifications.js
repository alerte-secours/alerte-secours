import { useCallback, useState, useRef, useEffect } from "react";
import { Platform, View } from "react-native";
import { useMutation } from "@apollo/client";
import { Title, RadioButton } from "react-native-paper";
import { useSessionState } from "~/stores";

import { createStyles } from "~/theme";
import Text from "~/components/Text";

import { DEVICE_NOTIFICATION_ALERT_LEVEL_MUTATION } from "./gql";

export default function ParamsNotifications({ data }) {
  const { deviceId } = useSessionState(["deviceId"]);
  const [deviceNotificationAlertLevelMutation] = useMutation(
    DEVICE_NOTIFICATION_ALERT_LEVEL_MUTATION,
  );

  let { notificationAlertLevel } = data.selectOneDevice;
  if (!notificationAlertLevel) {
    notificationAlertLevel = "green";
  }

  const setNotificationAlertLevel = useCallback(
    async (notificationAlertLevel) => {
      await deviceNotificationAlertLevelMutation({
        variables: {
          deviceId,
          notificationAlertLevel,
        },
      });
    },
    [deviceNotificationAlertLevelMutation, deviceId],
  );

  const styles = useStyles();

  return (
    <>
      <Title accessibilityRole="header" style={styles.title}>
        Notifications
      </Title>
      <View style={styles.box}>
        <Text style={styles.label}>Je souhaite recevoir des notifications</Text>
        <View style={styles.radioGroup}>
          <RadioButton.Group
            onValueChange={(newValue) => setNotificationAlertLevel(newValue)}
            value={notificationAlertLevel}
          >
            <RadioButton.Item
              style={[styles.radioItem, styles.radioItemGreen]}
              labelStyle={[styles.radioItemLabel, styles.radioItemLabelGreen]}
              label="Concernant tous les niveaux d'alerte y compris les demandes d'entraide"
              value="green"
            />
            <RadioButton.Item
              style={[styles.radioItem, styles.radioItemYellow]}
              labelStyle={[styles.radioItemLabel, styles.radioItemLabelYellow]}
              label="Concernant uniquement les dangers et les urgences"
              value="yellow"
            />
            <RadioButton.Item
              style={[styles.radioItem, styles.radioItemRed]}
              labelStyle={[styles.radioItemLabel, styles.radioItemLabelRed]}
              label="Concernant uniquement les urgences"
              value="red"
            />
          </RadioButton.Group>
        </View>
      </View>
    </>
  );
}

const useStyles = createStyles(({ theme: { colors, custom } }) => ({
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
    backgroundColor: colors.surface,
  },
  radioItemGreen: {
    borderColor: custom.appColors.green,
  },
  radioItemYellow: {
    borderColor: custom.appColors.yellow,
  },
  radioItemRed: {
    borderColor: custom.appColors.red,
  },
  radioItemLabelGreen: {},
  radioItemLabelYellow: {},
  radioItemLabelRed: {},
  radioItemLabel: { fontSize: 18 },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    paddingBottom: 15,
    textAlign: "center",
  },
}));
