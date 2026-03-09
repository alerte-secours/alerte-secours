import useColorScheme from "./useColorScheme";
import { Light, Dark } from "~/theme/app";

export default function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? Dark : Light;
}
