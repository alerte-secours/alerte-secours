import { Appearance } from "react-native";
import { useParamsState } from "~/stores";

export default function useColorScheme() {
  const { colorScheme } = useParamsState(["colorScheme"]);
  if (colorScheme === "auto") {
    return Appearance.getColorScheme();
  }
  return colorScheme || Appearance.getColorScheme();
}
