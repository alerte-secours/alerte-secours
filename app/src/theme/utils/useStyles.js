import { StyleSheet } from "react-native";
import { useDpStyle } from "~/lib/style/dp";
import useTheme from "./useTheme";
import useColorScheme from "./useColorScheme";

export default function useStyles(fn, extraProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  return useDpStyle((dpProps) => {
    const styles = fn(
      {
        ...dpProps,
        theme,
        scheme,
        ...(extraProps || {}),
      },
      extraProps ? [extraProps] : undefined,
    );
    return StyleSheet.create(styles);
  });
}
