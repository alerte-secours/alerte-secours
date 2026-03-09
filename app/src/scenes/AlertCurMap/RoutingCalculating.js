import React from "react";
import { View } from "react-native";

import { createStyles, useTheme } from "~/theme";

import Text from "~/components/Text";

import {
  STATE_CALCULATING_LOADING,
  STATE_CALCULATING_RELOADING,
} from "./constants";

const textLabels = {
  [STATE_CALCULATING_LOADING]: "Calcul de l'itinéraire en cours ...",
  [STATE_CALCULATING_RELOADING]: "Calcul du nouvel itinéraire en cours ...",
};

export default function RoutingCalculating({ calculatingState }) {
  const { colors, custom } = useTheme();
  const textLabel = textLabels[calculatingState];
  return (
    <View style={{}}>
      <Text
        style={{
          color: colors.secondary,
          fontSize: 16,
          paddingVertical: 15,
          paddingHorizontal: 7,
          textAlign: "center",
        }}
      >
        {textLabel}
      </Text>
    </View>
  );
}

// const useStyles = createStyles(
//   ({ wp, hp, scaleText, theme: { colors } }) => ({})
// );
