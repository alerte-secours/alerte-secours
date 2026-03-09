import React, { useCallback } from "react";
import { View, Linking } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";
import Text from "~/components/Text";
import sendSMS from "~/lib/sms/sendSMS";

export default function TelButton({ label, tel, description, mode }) {
  const styles = useStyles();

  const openPress = useCallback(async () => {
    const cleanTel = tel.replaceAll(" ", "");
    if (mode === "sms") {
      await sendSMS([cleanTel], "");
    } else {
      Linking.openURL(`tel:${cleanTel}`);
    }
  }, [tel, mode]);

  return (
    <View style={styles.container}>
      <TouchableRipple style={styles.button} onPress={openPress}>
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons name="phone" style={styles.icon} />
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.tel}>{tel}</Text>
          </View>
        </View>
      </TouchableRipple>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    marginHorizontal: 25,
    marginBottom: 25,
    width: "100%",
  },
  button: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 10,
    width: "100%",
    backgroundColor: colors.surface,
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  icon: {
    fontSize: 16,
    paddingHorizontal: 10,
    color: colors.primary,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: 36,
  },
  label: {
    color: colors.onBackground,
    fontSize: 18,
    fontWeight: "bold",
    maxWidth: "60%",
  },
  tel: {
    color: colors.onBackground,
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    marginTop: 5,
    marginHorizontal: 15,
  },
}));
