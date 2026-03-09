import React from "react";
import { View } from "react-native";
import { useSessionState } from "~/stores";
import Text from "~/components/Text";
import AlertInfoLine from "~/containers/AlertInfoLine";

export default function AlertInfoLineSentBy({ alert, ...props }) {
  const { userId } = alert;
  const { userId: sessionUserId } = useSessionState(["userId"]);
  const isSent = userId === sessionUserId;
  return (
    <AlertInfoLine
      iconName="human-handsup"
      labelText="Envoyée par"
      valueText={`${alert.username || "anonyme"}${isSent ? " (moi)" : ""}`}
      Value={({ ...valueTextProps }) => (
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text {...valueTextProps} />
        </View>
      )}
      {...props}
    />
  );
}
