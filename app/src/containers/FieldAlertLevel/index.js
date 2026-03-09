import React from "react";

import { View } from "react-native";
import { IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import capitalize from "lodash.capitalize";

import { createStyles, createStyleOptions } from "~/theme";
import Text from "~/components/Text";
import levelLabel from "~/misc/levelLabel";

// const iconSelected = "record-circle-outline"
// const iconSelected = "check-circle-outline"
// const iconSelected = "check-circle"
const iconSelected = "circle-slice-8";
// const iconUnselected = "circle"
const iconUnselected = "circle-outline";

export default function FieldAlertLevel({ style, level, setValue }) {
  const styles = useStyles();
  const styleOptions = useStyleOptions();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.field]}>
        <Text style={styles.label}>Niveau d'urgence de l'Alerte</Text>
        <View style={styles.value}>
          <View style={styles.buttons}>
            <IconButton
              onPress={() => setValue("red")}
              size={styleOptions.iconBtn.size}
              icon={({ style, ...props }) => (
                <MaterialCommunityIcons
                  name={level === "red" ? iconSelected : iconUnselected}
                  style={[
                    style,
                    styles.icon,
                    {
                      color: styleOptions.levelColors.red,
                    },
                    level === "red" && styles.iconFocused,
                  ]}
                  {...props}
                />
              )}
              style={styles.btn}
            />
            <IconButton
              onPress={() => setValue("yellow")}
              size={styleOptions.iconBtn.size}
              icon={({ style, ...props }) => (
                <MaterialCommunityIcons
                  name={level === "yellow" ? iconSelected : iconUnselected}
                  style={[
                    style,
                    styles.icon,
                    {
                      color: styleOptions.levelColors.yellow,
                    },
                    level === "yellow" && styles.iconFocused,
                  ]}
                  {...props}
                />
              )}
              style={styles.btn}
            />
            <IconButton
              onPress={() => setValue("green")}
              size={styleOptions.iconBtn.size}
              icon={({ style, ...props }) => (
                <MaterialCommunityIcons
                  name={level === "green" ? iconSelected : iconUnselected}
                  style={[
                    style,
                    styles.icon,
                    {
                      color: styleOptions.levelColors.green,
                    },
                    level === "green" && styles.iconFocused,
                  ]}
                  {...props}
                />
              )}
              style={styles.btn}
            />
          </View>
          <View
            style={[
              styles.valueLabelContainer,
              {
                backgroundColor: styleOptions.levelColors[level],
              },
            ]}
          >
            <Text style={styles.valueLabel}>
              {capitalize(levelLabel[level])}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const useStyleOptions = createStyleOptions(
  ({ fontSize, theme: { colors, custom } }) => ({
    levelColors: {
      red: custom.appColors.red,
      yellow: custom.appColors.yellow,
      green: custom.appColors.green,
    },
    iconBtn: {
      size: fontSize(30),
    },
  }),
);

const useStyles = createStyles(
  ({ wp, hp, scaleText, fontSize, theme: { colors, textShadowForWhite } }) => ({
    container: {
      marginTop: hp(1),
    },
    field: {
      borderColor: colors.outline,
      borderWidth: 1,
      borderRadius: 4,
      paddingLeft: wp(0),
      paddingRight: wp(2),
      paddingVertical: hp(2),
      marginTop: fontSize(12) / 2,
    },
    value: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 0,
      margin: 0,
    },
    buttons: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    label: {
      fontSize: fontSize(12),
      lineHeight: fontSize(12) * 1.5,
      top: (fontSize(-12) * 1.5) / 1.6,
      left: 6,
      color: colors.placeholder,
      backgroundColor: colors.background,
      alignSelf: "flex-start",
      paddingHorizontal: 4,
      zIndex: 2,
      position: "absolute",
      padding: 0,
    },
    btn: {
      marginVertical: 0,
      // marginHorizontal: wp(0.8),
      padding: 0,
      width: fontSize(30),
      height: fontSize(30),
    },
    icon: {
      // fontSize: fontSize(30),
      // opacity: 0.5,
    },
    iconFocused: {
      // opacity: 1,
      // ...textShadowForWhite,
    },
    valueLabelContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 4,
    },
    valueLabel: {
      color: colors.onPrimary,
      textAlign: "center",
      ...scaleText({ fontSize: 16 }),
      ...textShadowForWhite,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
  }),
);
