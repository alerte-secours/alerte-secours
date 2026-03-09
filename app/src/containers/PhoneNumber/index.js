import React, { useState, useRef, useCallback, useEffect } from "react";

import { View, StyleSheet } from "react-native";

import { Button } from "react-native-paper";

import selectContact from "~/lib/contacts/select";

import PhoneInput from "react-native-phone-number-input";
import ModalSelector from "react-native-modal-selector";
import countryCodesList from "country-codes-list";

import { MaterialIcons } from "@expo/vector-icons";
import Text from "~/components/Text";

import useMount from "~/hooks/useMount";

import { useTheme } from "~/theme";
import { parseInternationalNumber, removeLeadingZero } from "~/utils/phone";

import getContactName from "~/lib/contacts/get-contact-name";

import useDeviceCountryCode from "~/hooks/useDeviceCountryCode";
import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";
import { useI18n } from "~/i18n/context";

import ErrorMessage from "./ErrorMessage";

export default function PhoneNumber({
  phoneNumber,
  phoneCountry,
  setValueNumber,
  setValueCountry,
  // optional:
  field = {},
  textInputProps = {},
  resetField,
  fieldIsDirty,
  originEmpty,
  autoFocus,
  defaultCountryCode,
  phoneInputProps = {},
  error,
  style = {},
  contentStyle = {},
  inputStyle = {},
  useContactName = false,
  ErrorMessageComponents = {},
  DefaultErrorMessageComponent = ErrorMessage,
}) {
  const phoneInput = useRef();

  const defaultDeviceCountryCode = useDeviceCountryCode();
  if (!defaultCountryCode) {
    defaultCountryCode = defaultDeviceCountryCode;
  }

  const { colors, custom } = useTheme();

  const defaultValue = useRef({});
  useMount(() => {
    defaultValue.current = { phoneNumber, phoneCountry };
  });

  const [modalNumberSelect, setModalNumberSelect] = useState(null);

  const setPhoneNumber = useCallback(
    (value) => {
      if (!value) {
        return;
      }
      let fullPhoneNumber = parseInternationalNumber(value);
      if (!fullPhoneNumber) {
        const countryCode = defaultCountryCode;
        const nationalNumber = removeLeadingZero(value);
        const code = countryCodesList.findOne(
          "countryCode",
          countryCode,
        )?.countryCallingCode;
        fullPhoneNumber = { countryCode, nationalNumber, code };
      }
      const { countryCode, code } = fullPhoneNumber;
      let { nationalNumber } = fullPhoneNumber;
      phoneInput.current?.setState({
        countryCode: countryCode,
        code: code.toString(),
        nationalNumber,
      });
      setValueNumber(nationalNumber);
      setValueCountry(countryCode);
    },
    [setValueNumber, setValueCountry, defaultCountryCode],
  );

  const contactPicker = useCallback(async () => {
    const contact = await selectContact();
    if (!contact) {
      // TODO show tooltip: you should allow the user to select a contact to use the contact picker
      return;
    }
    const { phoneNumbers } = contact;
    if (phoneNumbers.length === 0) {
      return;
    }
    const phoneNumberList = [
      ...new Set(phoneNumbers.map(({ number }) => number.replaceAll(" ", ""))),
    ];
    if (phoneNumbers.length === 1) {
      setPhoneNumber(phoneNumbers[0].number);
      return;
    }
    setModalNumberSelect({
      data: [
        {
          key: "label",
          section: true,
          label: `Ce contact est rattaché à plusieurs numéros. \nSélectionnez le numéro à utiliser:`,
        },
        ...phoneNumberList.map((number, index) => ({
          key: index,
          value: number,
          // label: number,
          component: (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <PhoneNumberReadOnly internationalPhoneNumber={number} />
            </View>
          ),
        })),
      ],
    });
  }, [setModalNumberSelect, setPhoneNumber]);

  const [contactName, setContactName] = useState("");
  const { deviceCountryCode } = useI18n();
  useEffect(() => {
    if (!phoneNumber && contactName) {
      setContactName("");
    }
    if (useContactName && phoneNumber) {
      (async () => {
        const fullName = await getContactName(phoneNumber, phoneCountry, {
          defaultCountryCode: deviceCountryCode,
        });
        setContactName(fullName);
      })();
    }
  }, [
    phoneNumber,
    deviceCountryCode,
    setContactName,
    useContactName,
    phoneCountry,
    contactName,
  ]);

  const ErrorMessageComponent =
    error?.phoneNumber?.message &&
    ErrorMessageComponents[error.phoneNumber.message]
      ? ErrorMessageComponents[error.phoneNumber.message]
      : DefaultErrorMessageComponent;

  return (
    <View style={{ ...styles.container, ...style }}>
      {modalNumberSelect && (
        <ModalSelector
          key="modal-number-select"
          visible
          selectStyle={{ display: "none" }}
          data={modalNumberSelect.data}
          cancelText="Annuler"
          onModalClose={() => {
            setModalNumberSelect(null);
          }}
          onChange={async (option) => {
            setPhoneNumber(option.value);
            setModalNumberSelect(null);
          }}
        />
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          ...contentStyle,
        }}
      >
        <View style={{ ...inputStyle }}>
          {contactName && (
            <View
              style={{
                position: "absolute",
                // bottom: 0,
                // right: 5,
                top: 0,
                zIndex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "100%",
                }}
              >
                {contactName}
              </Text>
            </View>
          )}
          <PhoneInput
            key="phone-input"
            ref={phoneInput}
            defaultValue={phoneNumber}
            defaultCode={phoneCountry}
            layout="first"
            onChangeText={(text) => {
              setValueNumber(text);
            }}
            onChangeCountry={(text) => {
              setValueCountry(text.cca2);
            }}
            withDarkTheme
            withShadow
            autoFocus={autoFocus}
            textInputProps={{
              ...field,
              ...textInputProps,
            }}
            {...phoneInputProps}
          />
        </View>
        {resetField && fieldIsDirty && (
          <Button
            key="reset-field"
            style={{
              right: 53,
              justifyContent: "center",
              // right: 35,
              alignItems: "center",
              position: "absolute",
              height: "100%",
            }}
            onPress={() => {
              resetField();
            }}
          >
            <MaterialIcons
              name={
                originEmpty ? "highlight-remove" : "settings-backup-restore"
              }
              style={{ backgroundColor: "#F8F9F9", padding: 2 }}
              size={22}
            />
          </Button>
        )}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
          }}
        >
          <Button
            compact
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.primary,
              borderRadius: 0,
              minWidth: 48,
              flex: 1,
            }}
            onPress={contactPicker}
          >
            <MaterialIcons
              name="quick-contacts-dialer"
              size={24}
              color={colors.onPrimary}
            />
          </Button>
        </View>
      </View>
      {error?.phoneNumber && (
        <ErrorMessageComponent
          error={error.phoneNumber}
          phoneNumber={phoneNumber}
          phoneCountry={phoneCountry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
