import React from "react";
import { View } from "react-native";
import { Button, Title, Text } from "react-native-paper";
import { createStyles } from "~/theme";
import { useParamsState, paramsActions, treeActions } from "~/stores";
import { Ionicons } from "@expo/vector-icons";
import { useLayoutKey } from "~/navigation/Context";

function ThemeSwitcher() {
  const styles = useStyles();
  const { colorScheme } = useParamsState(["colorScheme"]);

  const [layoutKey, setLayoutKey] = useLayoutKey();
  const handleThemeChange = (newTheme) => {
    paramsActions.setColorScheme(newTheme);
    setLayoutKey(layoutKey + 1);
  };

  const themeOptions = [
    { label: "Clair", value: "light", icon: "sunny" },
    { label: "Sombre", value: "dark", icon: "moon" },
    { label: "Auto", value: "auto", icon: "contrast" },
  ];

  return (
    <View style={styles.container}>
      <Title accessibilityRole="header" style={styles.title}>
        Thème
      </Title>
      <View style={styles.buttonContainer}>
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            mode={colorScheme === option.value ? "contained" : "outlined"}
            onPress={() => handleThemeChange(option.value)}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel={`Thème ${option.label}`}
            accessibilityHint={`Applique le thème ${option.label.toLowerCase()}.`}
            accessibilityState={{ selected: colorScheme === option.value }}
            icon={({ size, color }) => (
              <Ionicons
                accessible={false}
                importantForAccessibility="no"
                name={option.icon}
                size={size}
                color={color}
              />
            )}
          >
            {option.label}
          </Button>
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  button: {
    marginHorizontal: 5,
    minWidth: 100,
  },
  description: {
    textAlign: "center",
    color: colors.onSurfaceVariant,
    paddingHorizontal: 20,
  },
}));

export default ThemeSwitcher;
