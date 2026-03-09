import React from "react";
import { View } from "react-native";

import { createStyles } from "~/theme";

import Text from "~/components/Text";

import NewAlertButton from "~/containers/NewAlertButton";
import AlertAggListButton from "~/containers/AlertAggListButton";

export default function Empty() {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.noAlertText}>
        Aucune alerte reçue ou envoyée n'est actuellement séléctionnée
      </Text>
      <View style={styles.alertListButton}>
        <AlertAggListButton />
      </View>
      <View style={styles.newAlertButton}>
        <NewAlertButton />
      </View>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  noAlertText: { width: 250, textAlign: "center", padding: 15 },
  alertListButton: { width: 250, padding: 15 },
  newAlertButton: { width: 250, padding: 15 },
}));
