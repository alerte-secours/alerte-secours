import { MD3LightTheme } from "react-native-paper";

const ThemeLight = {
  isDark: false,
  isLight: true,
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    primary: "#1864ab",
    onPrimary: "#ffffff",
    // primaryContainer: "",
    // onPrimaryContainer: "",

    secondary: "#5a77a2",
    onSecondary: "#ffffff",
    // secondaryContainer: "",
    // onSecondaryContainer: "",

    // tertiary: "",
    // onTertiary: "",
    // tertiaryContainer: "",
    // onTertiaryContainer: "",

    error: "#fa5252",
    onError: "#ffffff",
    errorContainer: "#fa5252",
    onErrorContainer: "#ffffff",

    warn: "#f59f00",
    ok: "#40c057",
    no: "#fa5252",
    critical: "#fa5252",

    background: "#f0f4f8",
    onBackground: "#2e4d7b",

    surface: "#ffffff",
    onSurface: "#2e4d7b",
    surfaceVariant: "#fcfcfc",
    onSurfaceVariant: "#5a77a2",
    surfaceSecondary: "#fafaff",

    outline: "#868e96",
    outlineVariant: "#dee2e6",

    accent: "#ffffff",
    placeholder: "rgba(0, 0, 0, 0.54)",

    grey: "#545454",
    blue: "#3f51b5",
    blueLight: "#339af0",

    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.4)",

    surfaceDisabled: "rgba(63, 99, 145, 0.12)", // Generated from 'onSurface' with opacity
    onSurfaceDisabled: "rgba(63, 99, 145, 0.38)", // Generated from 'onSurface' with higher opacity

    backdrop: "rgba(0, 0, 0, 0.4)",

    // Elevation levels (generated shades based on 'surface' color)
    elevation: {
      level0: "transparent",
      level1: "#f1f4fb",
      level2: "#eceff8",
      level3: "#e7ebf5",
      level4: "#e3e8f3",
      level5: "#dfe5f1",
    },
  },

  custom: {
    textShadowForColor: {
      textShadowColor: "#fafafa",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 2,
    },
    textShadowForSurfacePrimary: {
      textShadowColor: "#545454",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },

    notifications: {
      swipeActiveBackground: "rgba(33, 150, 243, 0.15)", // Light blue with transparency
      deleteSwipeBackground: "rgba(255, 59, 48, 0.15)", // Light red with transparency
    },

    appColors: {
      red: "#d9534f",
      yellow: "#dfaf2c",
      green: "#4caf50",
      unknown: "#339af0",
      call: "#4c6ef5",
      onColor: "#FFFFFF",
    },

    donation: {
      liberapay: "#f59f00", // Same as colors.warn
      buymeacoffee: "#40c057", // Same as colors.ok
      github: "#1864ab", // Same as colors.primary
      onDonation: "#FFFFFF",
    },
  },
};

export default ThemeLight;

/*

#e3eef8
#fafaff
rgba(0, 0, 0, 0.08)
rgb(243, 250, 255)
#495057
#d0e3ff
#001d3e
#d5e4ff
#122846
#4c6ef5
#ffffff
#dbe1ff
#0e1b54
#3f51b5
#e7f5ff

*/
