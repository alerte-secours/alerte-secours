import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AlertInfoLine from "~/containers/AlertInfoLine";
import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";

export default function AlertInfoLineNotifiedCount({
  alert,
  noBorder = false,
  ...props
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const renderColoredCount = (acknowledged, total) => {
    return (
      <View style={styles.countContainer}>
        <Text style={styles.acknowledgedText}>{acknowledged || 0}</Text>
        <Text style={styles.slashText}>/</Text>
        <Text style={styles.totalText}>{total || 0}</Text>
      </View>
    );
  };

  return (
    <>
      {alert.notifyRelatives && (
        <AlertInfoLine
          key="relatives"
          iconName="account-voice"
          labelText="Proches alertés"
          noBorder={noBorder}
          isFirst={true}
          Value={() =>
            renderColoredCount(
              alert.acknowledgedRelativeCount,
              alert.alertingRelativeCount,
            )
          }
          {...props}
        />
      )}

      {alert.notifyAround && (
        <AlertInfoLine
          key="around"
          iconName="account-voice"
          labelText="Personnes alentour alertées"
          noBorder={noBorder}
          isFirst={!alert.notifyRelatives}
          Value={() =>
            renderColoredCount(
              alert.acknowledgedAroundCount,
              alert.alertingAroundCount,
            )
          }
          {...props}
        />
      )}

      {alert.acknowledgedConnectCount > 0 && (
        <AlertInfoLine
          key="connect"
          iconName="account-voice"
          labelText="Alertés par SMS"
          noBorder={noBorder}
          isFirst={!alert.notifyRelatives && !alert.notifyAround}
          valueText={`${alert.acknowledgedConnectCount}`}
          valueTextStyle={styles.connectCount}
          {...props}
        />
      )}
    </>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  countContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  acknowledgedText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  slashText: {
    color: colors.grey,
    fontSize: 16,
    marginHorizontal: 2,
  },
  totalText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: "bold",
  },
  connectCount: {
    color: colors.primary,
    fontWeight: "bold",
  },
}));
