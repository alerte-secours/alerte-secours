import React from "react";

import { View } from "react-native";
import { useFormContext } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  createStyles,
  createStyleOptions,
  fontFamily,
  useTheme,
} from "~/theme";
import CheckboxItem from "~/components/CheckboxItem";
import { useSessionState, useParamsState } from "~/stores";

export default function FieldNotifySelector() {
  const styles = useStyles();
  const styleOptions = useStyleOptions();
  const { colors, custom } = useTheme();
  const { watch, setValue } = useFormContext();

  const callEmergency = watch("callEmergency");
  const notifyAround = watch("notifyAround");
  const notifyRelatives = watch("notifyRelatives");
  const followLocation = watch("followLocation");
  const level = watch("level");

  const checkedColor = colors.primary;
  const uncheckedColor = colors.primary;

  const { preferredEmergencyCall } = useParamsState(["preferredEmergencyCall"]);
  const callEmergencyLabel =
    preferredEmergencyCall === "sms"
      ? "Envoyer un SMS aux urgences"
      : "Appeler les urgences";

  return (
    <View style={styles.container}>
      {level !== "green" && (
        <View style={styles.checkboxItemContainer}>
          <CheckboxItem
            status={callEmergency ? "checked" : "unchecked"}
            style={styles.checkboxItem}
            labelStyle={styles.checkboxLabel}
            size={styleOptions.checkboxItem.size}
            icon={() => (
              <MaterialCommunityIcons
                name="phone"
                style={styles.checkboxIcon}
                onPress={() => {
                  setValue("callEmergency", !callEmergency);
                }}
              />
            )}
            color={checkedColor}
            uncheckedColor={uncheckedColor}
            label={callEmergencyLabel}
            onPress={() => {
              setValue("callEmergency", !callEmergency);
            }}
          />
        </View>
      )}
      <View style={styles.checkboxItemContainer}>
        <CheckboxItem
          status={notifyAround ? "checked" : "unchecked"}
          style={styles.checkboxItem}
          labelStyle={styles.checkboxLabel}
          size={styleOptions.checkboxItem.size}
          icon={() => (
            <MaterialCommunityIcons
              name="map-marker-radius"
              style={styles.checkboxIcon}
              onPress={() => {
                setValue("notifyAround", !notifyAround);
              }}
            />
          )}
          color={checkedColor}
          uncheckedColor={uncheckedColor}
          label="Alerter autour de moi"
          onPress={() => {
            setValue("notifyAround", !notifyAround);
          }}
        />
      </View>
      <View style={styles.checkboxItemContainer}>
        <CheckboxItem
          status={notifyRelatives ? "checked" : "unchecked"}
          style={styles.checkboxItem}
          labelStyle={styles.checkboxLabel}
          size={styleOptions.checkboxItem.size}
          color={checkedColor}
          uncheckedColor={uncheckedColor}
          icon={() => (
            <MaterialCommunityIcons
              name="account-group"
              style={styles.checkboxIcon}
              onPress={() => {
                setValue("notifyRelatives", !notifyRelatives);
              }}
            />
          )}
          label="Prévenir mes proches"
          onPress={() => {
            setValue("notifyRelatives", !notifyRelatives);
          }}
        />
      </View>
      <View style={styles.followLocationContainer}>
        <CheckboxItem
          status={followLocation ? "checked" : "unchecked"}
          style={styles.checkboxItem}
          labelStyle={styles.checkboxLabel}
          size={styleOptions.checkboxItem.size}
          icon={() => (
            <MaterialCommunityIcons
              name="crosshairs-gps"
              style={styles.checkboxIcon}
              onPress={() => {
                setValue("followLocation", !followLocation);
              }}
            />
          )}
          color={checkedColor}
          uncheckedColor={uncheckedColor}
          label="Suivre ma localisation"
          onPress={() => {
            setValue("followLocation", !followLocation);
          }}
        />
      </View>
    </View>
  );
}

const useStyleOptions = createStyleOptions(
  ({ wp, hp, scaleText, fontSize, theme: { colors, textShadowForWhite } }) => ({
    checkboxItem: {
      size: fontSize(24),
    },
  }),
);

const useStyles = createStyles(
  ({ wp, hp, scaleText, fontSize, theme: { colors, textShadowForWhite } }) => ({
    container: {
      marginTop: hp(2),
      marginBottom: hp(3),
    },
    checkboxItemContainer: {
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.outline,
      marginVertical: hp(0.2),
      backgroundColor: colors.surface,
    },
    followLocationContainer: {
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.outline,
      marginVertical: hp(4),
      backgroundColor: colors.surface,
    },
    checkboxItem: {
      paddingHorizontal: 6,
    },
    checkboxIcon: {
      ...scaleText({ fontSize: 18 }),
      marginHorizontal: 5,
      color: colors.primary,
    },
    checkboxLabel: {
      paddingLeft: 5,
      ...scaleText({ fontSize: 16 }),
      flex: 1,
      fontFamily,
      alignItems: "center",
      justifyContent: "center",
    },
  }),
);
