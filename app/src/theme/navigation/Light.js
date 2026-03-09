import { DefaultTheme } from "@react-navigation/native";

import AppLightTheme from "~/theme/app/Light";

const ThemeLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AppLightTheme.colors.primary,
    background: AppLightTheme.colors.background,
  },
};

export default ThemeLight;
