import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Text from "~/components/Text";
import { createStyles, fontFamily, useTheme } from "~/theme";

export default function AlertAggListButton() {
  const styles = useStyles();
  const { colors, custom } = useTheme();
  const navigation = useNavigation();

  return (
    <Button
      mode="contained"
      style={styles.button}
      icon={() => (
        <MaterialCommunityIcons
          name="message-bulleted"
          size={22}
          color={colors.onPrimary}
          style={styles.icon}
        />
      )}
      uppercase={true}
      onPress={() => {
        navigation.navigate({
          name: "AlertAgg",
          params: {
            screen: "AlertAggTab",
            params: {
              screen: "AlertAggList",
            },
          },
        });
      }}
      contentStyle={styles.content}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.labelTextWrapper}>Liste des alertes</Text>
      </View>
    </Button>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  labelTextWrapper: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.onPrimary,
    fontFamily,
  },
}));
