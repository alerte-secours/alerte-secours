const ThemeDark = {
  isDark: true,
  isLight: false,
  colors: {
    primary: "#b3c4ff",
    onPrimary: "#ffffff",
    // primaryContainer: "",
    // onPrimaryContainer: "",

    secondary: "#b0c9e3",
    onSecondary: "#1e3348",
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

    background: "#121212",
    onBackground: "#FFFFFF",

    surface: "#1C1C1E",
    onSurface: "#FFFFFF",
    surfaceVariant: "#2C2C2E",
    onSurfaceVariant: "#E0E0E0",

    surfaceSecondary: "#3C3C3E",

    outline: "#8A868C",
    outlineVariant: "#49454F",

    accent: "#FFFFFF",
    placeholder: "rgba(255, 255, 255, 0.7)",

    grey: "#CCCCCC",
    blue: "#819CA9",
    blueLight: "#77C3F2",

    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.5)",

    surfaceDisabled: "rgba(255, 255, 255, 0.12)",
    onSurfaceDisabled: "rgba(255, 255, 255, 0.38)",

    backdrop: "rgba(0, 0, 0, 0.6)",

    // Elevation levels (adjusted for darker surface)
    elevation: {
      level0: "transparent",
      level1: "#1E1E1E",
      level2: "#232323",
      level3: "#252525",
      level4: "#272727",
      level5: "#2C2C2C",
    },
  },

  custom: {
    textShadowForColor: {
      textShadowColor: "#000000",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 2,
    },
    textShadowForSurfacePrimary: {
      textShadowColor: "#000000",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },

    notifications: {
      swipeActiveBackground: "rgba(77, 182, 255, 0.25)", // Brighter blue with transparency for dark mode
      deleteSwipeBackground: "rgba(255, 69, 58, 0.25)", // Brighter red with transparency for dark mode
    },

    appColors: {
      // red: "#FF9E99",
      // yellow: "#FFDF9E",
      // green: "#9EF6A2",
      // unknown: "#77C3F2",
      // call: "#B3C4FF",
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
      github: "#b3c4ff", // Same as colors.primary (dark theme)
      onDonation: "#FFFFFF",
    },
  },
};
export default ThemeDark;

/*

#00497f
#d0e3ff
#354a5f
#d5e4ff
#a9d1ff
#0d256d
#273d84
#dbe1ff
#A1A8D4

#121212 bottomMostLayer
#1C1C1E bottomLayer
#2C2C2E topLayer
#3C3C3E topMostLayer

*/
