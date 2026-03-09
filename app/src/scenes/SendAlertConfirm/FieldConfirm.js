import React, { createRef, useState, useEffect, useCallback } from "react";
import { View, TouchableWithoutFeedback } from "react-native";
import { Button } from "react-native-paper";
import { useFormContext } from "react-hook-form";

import * as Animatable from "react-native-animatable";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";
import CountdownCircle from "~/components/CountdownCircle";
import { createStyles, createStyleOptions, fontFamily } from "~/theme";

import useOnSubmit from "./useOnSubmit";

const COUNTDOWN_SECONDS = 9;

export default function FieldConfirm({ style, autoConfirmEnabled, confirmed }) {
  const styles = useStyles();
  const styleOptions = useStyleOptions();

  const { watch, formState } = useFormContext();

  const onSubmit = useOnSubmit();

  const level = watch("level");

  const [autoConfirmRunning, setAutoConfirmRunning] = useState(() => {
    if (level == "red") {
      return true;
    }
  });

  const [autoConfirmVisible, setAutoConfirmVisible] =
    useState(autoConfirmRunning);
  const cancelAutoConfirm = useCallback(() => {
    setAutoConfirmRunning(false);
    (async () => {
      if (!autoConfirmViewRef.current) {
        return;
      }
      const endState = await autoConfirmViewRef.current.fadeOut(700);
      if (endState.finished) {
        setAutoConfirmVisible(false);
      }
    })();
  }, [setAutoConfirmRunning, autoConfirmViewRef]);

  useEffect(() => {
    if (autoConfirmRunning && level != "red") {
      cancelAutoConfirm();
    }
  }, [autoConfirmRunning, cancelAutoConfirm, level]);

  const autoConfirmViewRef = createRef();
  const confirmViewRef = createRef();

  return (
    <View style={[styles.container, style]}>
      {autoConfirmEnabled && autoConfirmVisible && (
        <Animatable.View ref={autoConfirmViewRef}>
          <TouchableWithoutFeedback
            accessibilityRole="button"
            onPress={cancelAutoConfirm}
          >
            <View style={styles.countDownContainer}>
              <Text style={styles.countDownLabel}>
                {`Confirmation\nautomatique`}
              </Text>
              <View style={styles.countDownCenter}>
                <CountdownCircle
                  style={styles.countDownCircle}
                  seconds={confirmed ? 1 : COUNTDOWN_SECONDS}
                  radius={styleOptions.countDownCircle.radius}
                  borderWidth={styleOptions.countDownCircle.borderWidth}
                  color={styleOptions.countDownCircle.color}
                  bgColor={styleOptions.countDownCircle.bgColor}
                  shadowColor={styleOptions.countDownCircle.shadowColor}
                  textStyle={styles.countDownTextStyle}
                  onTimeElapsed={() => {
                    if (!autoConfirmRunning) {
                      return;
                    }
                    confirmViewRef.current?.flash(700);
                    autoConfirmViewRef.current?.fadeOut(700);
                    onSubmit();
                  }}
                  paused={!autoConfirmRunning}
                />
              </View>
              <View style={styles.countDownCancel}>
                <Text style={styles.countDownCancelLabel}>Annuler</Text>
                <MaterialCommunityIcons
                  name="close-circle"
                  style={[styles.countDownCancelIcon]}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animatable.View>
      )}

      <Animatable.View ref={confirmViewRef}>
        <Button
          onPress={onSubmit}
          mode="contained"
          style={styles.confirmBtn}
          contentStyle={styles.confirmBtnContent}
          labelStyle={styles.confirmLabel}
          disabled={formState.isSubmitting || formState.isSubmitted}
          icon={() => (
            <MaterialCommunityIcons
              style={styles.confirmIcon}
              name="bullhorn"
            />
          )}
        >
          Confirmer
        </Button>
      </Animatable.View>
    </View>
  );
}

const useStyleOptions = createStyleOptions(
  ({ wp, hp, scaleText, fontSize, theme: { colors, custom } }) => ({
    countDownCircle: {
      radius: wp(3.5),
      borderWidth: 3,
      color: custom.appColors.red,
      bgColor: colors.background,
      shadowColor: colors.onBackground,
    },
  }),
);

const useStyles = createStyles(
  ({ wp, hp, scaleText, fontSize, theme: { colors, textShadowForWhite } }) => ({
    container: {
      // flex: 1,
    },
    confirmBtn: {
      height: hp(13),
      justifyContent: "center",
      marginBottom: 30,
    },
    confirmBtnContent: {
      height: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    confirmLabel: {
      ...scaleText({ fontSize: 18 }),
      fontFamily,
      ...textShadowForWhite,
    },
    confirmIcon: {
      ...scaleText({ fontSize: 24 }),
      color: colors.onPrimary,
      ...textShadowForWhite,
    },

    countDownContainer: {
      borderWidth: 1,
      borderColor: colors.outline,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: hp(1),
      borderRadius: 4,
      paddingVertical: hp(1),
      paddingHorizontal: wp(1),
    },

    countDownLabel: {
      flex: 1,
      ...scaleText({ fontSize: 11 }),
      margin: 0,
    },
    countDownCancel: {
      flex: 1,
      flexDirection: "row",
      margin: 0,
      textAlign: "right",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    countDownCancelLabel: {
      color: colors.primary,
      ...scaleText({ fontSize: 16 }),
    },
    countDownCancelIcon: {
      color: colors.primary,
      ...scaleText({ fontSize: 16 }),
      paddingLeft: wp(1),
    },
    countDownCenter: {
      flex: 1,
      alignItems: "center",
    },
    countDownCircle: {},

    countDownTextStyle: {
      fontSize: wp(4),
      color: colors.onBackground,
      fontFamily,
    },
  }),
);
