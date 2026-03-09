import React from "react";
import { View, Image } from "react-native";

import Text from "~/components/Text";
import { createStyles, useTheme, useColorScheme } from "~/theme";
import maxRadiusIcon from "~/assets/img/batman-head.png";
import maxRadiusIconDark from "~/assets/img/batman-head-reverse.png";

import { maxRadiusInfoMessage } from "./constants";

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    flexDirection: "column",
    alignItems: "center",
  },
  image: {
    width: 24,
    height: 24,
  },
  text: {
    color: colors.onSurface,
  },
}));

export default function MaxRadiusToast() {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={colorScheme === "dark" ? maxRadiusIconDark : maxRadiusIcon}
      />
      <Text style={styles.text}>{maxRadiusInfoMessage}</Text>
    </View>
  );
}
