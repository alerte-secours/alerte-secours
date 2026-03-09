import useStyles from "./useStyles";

export default function createStyles(fn) {
  return function (extra) {
    return useStyles(fn, extra);
  };
}
