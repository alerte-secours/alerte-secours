import React, { forwardRef } from "react";

import { TextInput } from "react-native-paper";
import { useFormContext } from "react-hook-form";

function FieldInputText(
  { name, shouldDirty = true, error, errorMessage, ...inputProps },
  ref,
) {
  const { setValue, trigger, watch } = useFormContext();
  const value = watch(name);

  const computedErrorMessage = errorMessage ?? error?.message;

  const computedAccessibilityHint =
    inputProps.accessibilityHint ?? computedErrorMessage;

  const computedAccessibilityState = {
    ...(inputProps.accessibilityState ?? {}),
    ...(error || computedErrorMessage ? { invalid: true } : null),
  };

  const handleChangeText = async (newValue) => {
    await setValue(name, newValue, { shouldDirty });

    // If there's currently an error, validate immediately
    // see also https://github.com/orgs/react-hook-form/discussions/10114
    if (error) {
      await trigger(name);
    }
  };

  const handleBlur = async () => {
    await trigger(name);
  };

  return (
    <TextInput
      ref={ref}
      name={name}
      onChangeText={handleChangeText}
      onBlur={handleBlur}
      value={value}
      error={!!error}
      accessibilityHint={computedAccessibilityHint}
      accessibilityState={computedAccessibilityState}
      {...inputProps}
    />
  );
}

export default forwardRef(FieldInputText);
