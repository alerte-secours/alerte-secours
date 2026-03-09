import useStyleOptions from "./useStyleOptions";

export default function createStyleOptions(fn) {
  return function (extra) {
    return useStyleOptions(fn, extra);
  };
}
