import { DarkTheme } from "@react-navigation/native";

import AppDarkTheme from "~/theme/app/Dark";

const ThemeDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: AppDarkTheme.colors.primary,
    background: AppDarkTheme.colors.background,
  },
};

export default ThemeDark;
