import { useDpStyle } from "~/lib/style/dp";
import useTheme from "./useTheme";

export default function useStyleOptions(fn, extraProps) {
  const theme = useTheme();
  return useDpStyle((dpProps) => {
    const styleOptions = fn(
      {
        ...dpProps,
        theme,
        ...(extraProps || {}),
      },
      extraProps ? [extraProps] : undefined,
    );
    return styleOptions;
  });
}
