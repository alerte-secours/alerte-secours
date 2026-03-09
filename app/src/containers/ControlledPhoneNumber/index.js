import React, { useRef, useCallback, useEffect } from "react";

import { useFormContext, useController } from "react-hook-form";

import useMount from "~/hooks/useMount";

import get from "lodash.get";

import PhoneNumber from "~/containers/PhoneNumber";
import { isValidNumber } from "~/utils/phone";

export default function ControlledPhoneNumber({
  fieldKey,
  validate,
  rules = {},
  onChangeCountry,
  onChangeNumber,
  textInputProps,
  ...phoneNumberPropsDrillDown
}) {
  const {
    watch,
    setValue,
    formState: { defaultValues, errors, dirtyFields },
    resetField,
    trigger,
  } = useFormContext();

  const phoneNumber = watch(`${fieldKey}.phoneNumber`);
  const phoneCountry = watch(`${fieldKey}.phoneCountry`);

  const defaultValue = useRef({});
  useMount(() => {
    defaultValue.current = { phoneNumber, phoneCountry };
  });
  // const fieldIsDirty = get(dirtyFields, fieldKey)?.phoneNumber;
  const originValue = get(defaultValues, fieldKey) || {};
  // console.log("originValue", originValue);
  const fieldIsDirty =
    originValue.phoneNumber !== undefined &&
    (phoneNumber !== originValue.phoneNumber ||
      phoneCountry !== originValue.phoneCountry);
  const originEmpty = !originValue.phoneNumber;

  const validateRule = {
    validPhoneNumber: async (value, values) => {
      if (!value) {
        return true;
      }
      const countryCode = get(values, fieldKey)?.phoneCountry;
      if (!isValidNumber(value, countryCode)) {
        return "Ce numéro de téléphone est invalide";
      }
      return true;
    },
    ...(validate
      ? typeof validate === "function"
        ? { custom: validate }
        : validate
      : {}),
  };

  const { field } = useController({
    name: `${fieldKey}.phoneNumber`,
    rules: {
      validate: validateRule,
      ...rules,
    },
  });

  const phoneNumberKey = `${fieldKey}.phoneNumber`;

  const boundResetField = useCallback(() => {
    resetField(phoneNumberKey);
  }, [resetField, phoneNumberKey]);

  const setValueNumber = useCallback(
    (value) => {
      setValue(phoneNumberKey, value, { shouldDirty: true });
      const error = get(errors, phoneNumberKey);
      if (Array.isArray(error) ? error.length > 0 : error) {
        trigger(phoneNumberKey);
      }
      onChangeNumber && onChangeNumber(value);
    },
    [setValue, phoneNumberKey, errors, onChangeNumber, trigger],
  );

  const setValueCountry = useCallback(
    (countryCode) => {
      const key = `${fieldKey}.phoneCountry`;
      setValue(key, countryCode, { shouldDirty: true });
      trigger(phoneNumberKey);
      onChangeCountry && onChangeCountry(countryCode);
    },
    [fieldKey, setValue, trigger, phoneNumberKey, onChangeCountry],
  );

  useEffect(() => {
    trigger(phoneNumberKey);
  }, [phoneCountry, phoneNumberKey, trigger]);

  const phoneNumberProps = {
    field,
    fieldIsDirty,
    originEmpty,
    resetField: boundResetField,
    phoneNumber,
    phoneCountry,
    setValueNumber,
    setValueCountry,
    error: get(errors, fieldKey),
    textInputProps,
    ...phoneNumberPropsDrillDown,
  };

  return <PhoneNumber {...phoneNumberProps} />;
}
