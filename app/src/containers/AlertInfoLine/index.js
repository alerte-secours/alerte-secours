import React from "react";
import { View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";

export default function AlertInfoLine({
  Label = Text,
  Icon = MaterialCommunityIcons,
  iconName,
  Value = Text,
  labelText,
  valueText,
  containerStyle = {},
  labelContainerStyle = {},
  labelTextStyle = {},
  valueTextStyle = {},
  isFirst,
  noBorder = false,
}) {
  const styles = useStyles();
  const { colors, custom } = useTheme();
  return (
    <View
      style={[
        styles.container,
        isFirst ? { borderTopWidth: 0 } : {},
        noBorder ? { borderTopWidth: 0 } : {},
        containerStyle,
      ]}
    >
      <View style={[styles.labelContainer, labelContainerStyle]}>
        {Icon && (
          <Icon
            name={iconName}
            size={24}
            color={colors.blue}
            style={styles.icon}
          />
        )}
        <Label style={[styles.labelText, labelTextStyle]}>{labelText}</Label>
      </View>
      <Value style={[styles.valueText, valueTextStyle]}>{valueText}</Value>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderColor: colors.grey,
    borderTopWidth: 0.2,
  },
  icon: {
    paddingRight: 6,
  },
  labelContainer: {
    flexDirection: "row",
  },
  labelText: {
    fontSize: 16,
    paddingVertical: 2,
  },
  valueText: {
    fontSize: 16,
    textAlign: "right",
    paddingVertical: 2,
    marginLeft: 10,
    flexGrow: 1,
  },
}));
