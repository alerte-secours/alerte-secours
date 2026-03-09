// based on https://github.com/marudy/react-native-responsive-screen
import { useMemo } from "react";
import { useWindowDimensions, PixelRatio } from "react-native";
import { scaleText, fontSize } from "~/lib/style/text";

export function wp(widthPercent, screenWidth) {
  const elemWidth =
    typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
}

export function hp(heightPercent, screenHeight) {
  const elemHeight =
    typeof heightPercent === "number"
      ? heightPercent
      : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
}

export function useWp(widthPercent) {
  const { width } = useWindowDimensions();
  return wp(widthPercent, width);
}

export function useHp(heightPercent) {
  const { height } = useWindowDimensions();
  return hp(heightPercent, height);
}

export function useDpStyle(fn, memoArgs = []) {
  const window = useWindowDimensions();
  const { height, width } = window;
  const hpLocal = (h) => hp(h, height);
  const wpLocal = (w) => wp(w, width);
  const wScaleText = (o) => scaleText(o, width);
  const wFontSize = (o) => fontSize(o, width);
  return useMemo(
    () =>
      fn({
        hp: hpLocal,
        wp: wpLocal,
        scaleText: wScaleText,
        fontSize: wFontSize,
        window,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [height, width, ...memoArgs],
  );
}
