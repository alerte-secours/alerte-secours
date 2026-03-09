import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Text from "~/components/Text";
import { createStyles, fontFamily, useTheme } from "~/theme";

export default function NewAlertButton({ compact = false }) {
  const styles = useStyles();
  const { colors, custom } = useTheme();
  const navigation = useNavigation();

  return (
    <Button
      mode="contained"
      style={[styles.button, compact && styles.compactButton]}
      icon={({ size, color }) => (
        <MaterialCommunityIcons
          name="chat-plus-outline"
          size={compact ? 18 : size}
          color={color}
          style={styles.icon}
        />
      )}
      labelStyle={[
        styles.labelTextWrapper,
        compact && styles.compactLabelTextWrapper,
      ]}
      uppercase={false}
      onPress={() => {
        navigation.navigate({
          name: "SendAlert",
          params: {
            screen: "SendAlertTab",
          },
        });
      }}
      contentStyle={[styles.content, compact && styles.compactContent]}
    >
      Nouvelle alerte
    </Button>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactButton: {
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  compactContent: {
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  icon: {
    marginRight: 8,
  },
  labelTextWrapper: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.onPrimary,
    fontFamily,
  },
  compactLabelTextWrapper: {
    fontSize: 14,
    height: 18,
    lineHeight: 18,
  },
}));
