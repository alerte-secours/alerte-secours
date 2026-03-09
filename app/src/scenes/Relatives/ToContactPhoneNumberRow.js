import React from "react";

import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";
import { IconButton } from "react-native-paper";
import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";

import { useTheme } from "~/theme";

import ErrorMessageComponents from "./ErrorMessageComponents";

import ErrorMessageNotRegistered from "./ErrorMessageNotRegistered";

import { statusLabels, statusIcons } from "./labels";

export default function ToContactPhoneNumberRow({
  relative,
  deleteRelativeModal,
  data,
}) {
  const { colors, custom } = useTheme();

  const unmatched =
    relative.type === "unregistered" ? "unmatchedRegistered" : false;

  let status = "";
  if (unmatched) {
    status = unmatched;
  } else {
    const relativeRow = data.selectOneUser.manyRelative.find(
      ({ oneViewRelativePhoneNumber: { onePhoneNumberAsTo } }) =>
        onePhoneNumberAsTo.number === relative.number &&
        onePhoneNumberAsTo.country === relative.country,
    );
    if (relativeRow) {
      const { allowed } = relativeRow.oneRelativeAllow;
      if (allowed === null) {
        status = "waiting";
      } else if (allowed === false) {
        status = "blocked";
      } else if (allowed === true) {
        status = "accepted";
      }
    }
  }

  const statusColors = {
    accepted: colors.ok,
    blocked: colors.error,
    waiting: colors.warn,
    unmatchedRegistered: colors.warn,
  };

  return (
    <View style={{}}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{}}>
          <PhoneNumberReadOnly
            phoneNumber={relative.number}
            phoneCountry={relative.country}
            inputStyle={{
              borderBottomWidth: 1,
            }}
            useContactName
            ErrorMessageComponents={ErrorMessageComponents}
          />
        </View>
        <View
          style={{
            alignSelf: "flex-end",
            paddingBottom: 5,
          }}
        >
          <IconButton
            size={14}
            style={{
              backgroundColor: colors.no,
            }}
            icon={() => (
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.onPrimary}
              />
            )}
            onPress={() => deleteRelativeModal(relative)}
          />
        </View>
      </View>
      <View>
        {status !== "accepted" && (
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 25,
              marginHorizontal: 10,
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
                <Text style={{ fontSize: 16 }}>{statusLabels[status]}</Text>
              )}
              {status === "unmatchedRegistered" && (
                <ErrorMessageNotRegistered
                  phoneNumber={relative.number}
                  phoneCountry={relative.country}
                  title={statusLabels[status]}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
