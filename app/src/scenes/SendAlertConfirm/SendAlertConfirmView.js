import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { createStyles } from "~/theme";
import { useFormContext } from "react-hook-form";
import LittleLoader from "~/components/LittleLoader";

import FieldLevel from "./FieldLevel";
import FieldSubject from "./FieldSubject";
import FieldNotifySelector from "./FieldNotifySelector";
import FieldConfirm from "./FieldConfirm";

export default function SendAlertConfirmView({ confirmed }) {
  const styles = useStyles();
  const { formState } = useFormContext();
  const isLoading = formState.isSubmitting || formState.isSubmitted;

  const [usedSubject, setUsedSubject] = useState(false);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loader}>
          <LittleLoader />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={parentScrollEnabled}
    >
      <View style={styles.top}>
        <FieldLevel />

        <FieldSubject
          setUsedSubject={setUsedSubject}
          setParentScrollEnabled={setParentScrollEnabled}
        />
      </View>
      <View style={styles.middle}>
        <FieldNotifySelector />
      </View>
      <View style={styles.bottom}>
        <FieldConfirm autoConfirmEnabled={!usedSubject} confirmed={confirmed} />
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles(
  ({ wp, hp, scaleText, fontSize, theme: { colors, textShadowForWhite } }) => ({
    container: {
      paddingVertical: hp(1),
      marginHorizontal: wp(2),
      flexGrow: 1,
    },
    top: {
      marginBottom: hp(2),
    },
    middle: {
      marginBottom: hp(2),
    },
    bottom: {
      marginTop: "auto",
      paddingBottom: hp(2),
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loader: {
      width: wp(20),
      height: wp(20),
    },
  }),
);
