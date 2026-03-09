import invert from "lodash.invert";

export const levelNum = {
  green: 1,
  yellow: 2,
  red: 3,
};
export const numLevel = invert(levelNum);
export const numMax = 3;
