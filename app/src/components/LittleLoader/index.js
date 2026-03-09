import LottieView from "lottie-react-native";
import { useTheme } from "~/theme";

const loaderSource = require("~/assets/animation/loader-infinity.json");

export default function LittleLoader({ source, style, ...props }) {
  const { colors, isDark } = useTheme();

  // Create color filter to change the animation color based on theme
  const colorFilters = [
    {
      keypath: "Shape Layer 1",
      color: isDark ? "#FFF" : "#000",
    },
    {
      keypath: "Shape Layer 2",
      color: colors.primary,
    },
  ];

  return (
    <LottieView
      autoPlay
      loop
      source={loaderSource}
      style={[{ width: "100%", height: "100%" }, style]}
      colorFilters={colorFilters}
      {...props}
    />
  );
}
