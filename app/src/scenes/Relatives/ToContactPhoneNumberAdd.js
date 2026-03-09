import React, { useCallback, useState, useEffect, useMemo } from "react";

import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import ControlledPhoneNumber from "~/containers/ControlledPhoneNumber";
import Text from "~/components/Text";

import { useFormContext } from "react-hook-form";

import { useTheme } from "~/theme";

import get from "lodash.get";
import { isValidNumber } from "~/utils/phone";

import useCheckPhoneNumberRegistered from "~/hooks/queries/useCheckPhoneNumberRegistered";

import ErrorMessageComponents from "./ErrorMessageComponents";

import ErrorMessageNotRegistered from "./ErrorMessageNotRegistered";
import ErrorMessageNotRelative from "./ErrorMessageNotRelative";

import { statusLabels, statusIcons } from "./labels";

export default function ToContactPhoneNumberAdd({ data, onSubmitEditing }) {
  const { colors, custom } = useTheme();

  const { getFieldState, watch } = useFormContext();

  const fieldKey = "new";

  const { invalid } = getFieldState(`${fieldKey}.phoneNumber`);

  const { checkNumberState } = useCheckPhoneNumberRegistered();
  const existingPhoneNumbers = useMemo(
    () => [
      ...(data.selectOneUser?.manyRelative.map(
        (row) => row.oneViewRelativePhoneNumber.onePhoneNumberAsTo,
      ) || []),
      ...(data.selectOneUser?.manyRelativeUnregistered.map((row) => ({
        country: row.phoneCountry,
        number: row.phoneNumber,
      })) || []),
    ],
    [
      data.selectOneUser?.manyRelative,
      data.selectOneUser?.manyRelativeUnregistered,
    ],
  );
  const validate = useCallback(
    async (value, values) => {
      const valuePhoneCountry = get(values, fieldKey)?.phoneCountry;
      if (
        existingPhoneNumbers.find(
          (row) => row.number === value && row.country === valuePhoneCountry,
        )
      ) {
        return "Ce numéro de téléphone est déjà enregistré dans vos contacts d'urgence";
      }
    },
    [existingPhoneNumbers],
  );

  const controlledPhoneNumberProps = {
    fieldKey,
    validate,
    phoneInputProps: {
      placeholder: `Numéro de téléphone`,
    },
  };

  const phoneNumber = watch(`${fieldKey}.phoneNumber`);
  const phoneCountry = watch(`${fieldKey}.phoneCountry`);

  const [unmatched, setUnmatched] = useState(false);

  useEffect(() => {
    (async () => {
      const isValid = isValidNumber(phoneNumber, phoneCountry);
      if (isValid && phoneNumber && phoneCountry) {
        const numberState = await checkNumberState(phoneNumber, phoneCountry);
        if (!numberState.isRegistered) {
          setUnmatched("unmatchedRegistered");
          return;
        }
        if (!numberState.existsAsRelative) {
          setUnmatched("unmatchedRelative");
          return;
        }
      }
      setUnmatched(false);
    })();
  }, [phoneNumber, phoneCountry, setUnmatched, checkNumberState]);

  let status = "new";
  const isEmpty = !phoneNumber || !phoneCountry;
  if (!isEmpty && unmatched) {
    status = unmatched;
  }

  const statusColors = {
    unmatchedRelative: colors.warn,
    unmatchedRegistered: colors.warn,
    new: colors.surface,
  };

  return (
    <View style={{}}>
      <ControlledPhoneNumber
        {...controlledPhoneNumberProps}
        inputStyle={{
          borderColor: invalid ? colors.error : statusColors[status],
          borderBottomWidth: 1,
        }}
        textInputProps={{
          returnKeyType: "done",
          onSubmitEditing,
        }}
        useContactName
        ErrorMessageComponents={ErrorMessageComponents}
      />
      {status !== "new" && (
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            paddingVertical: 5,
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <MaterialCommunityIcons
            style={{ marginRight: 15 }}
            name={statusIcons[status]}
            size={26}
            color={statusColors[status]}
          />
          <View style={{ flex: 1 }}>
            {!status.startsWith("unmatched") && (
              <Text style={{}}>{statusLabels[status]}</Text>
            )}
            {status === "unmatchedRegistered" && (
              <ErrorMessageNotRegistered
                phoneNumber={phoneNumber}
                phoneCountry={phoneCountry}
                title={statusLabels[status]}
              />
            )}
            {status === "unmatchedRelative" && (
              <ErrorMessageNotRelative title={statusLabels[status]} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}
