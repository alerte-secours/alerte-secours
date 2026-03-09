/* deprecated, not used anymore */

import React, { useCallback } from "react";

import { View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import CheckboxItem from "~/components/CheckboxItem";

import { useFormContext } from "react-hook-form";

export default function PhoneNumberCheckboxIsPrivate({ fieldKey }) {
  const { watch, setValue } = useFormContext();
  const isPrivateFieldKey = `${fieldKey}.isPrivate`;
  const isPrivate = watch(isPrivateFieldKey);
  const toggleCheck = useCallback(() => {
    setValue(isPrivateFieldKey, !isPrivate);
  }, [setValue, isPrivateFieldKey, isPrivate]);
  return (
    <View>
      <CheckboxItem
        status={isPrivate ? "checked" : "unchecked"}
        // style={styles.checkboxItem}
        // labelStyle={styles.checkboxLabel}
        // size={styleOptions.checkboxItem.size}
        icon={() => (
          <MaterialIcons
            name={isPrivate ? "visiblity-off" : "visiblity"}
            // style={styles.checkboxIcon}
            onPress={toggleCheck}
          />
        )}
        label="Masquer ce numéro de téléphone"
        onPress={toggleCheck}
      />
    </View>
  );
}
