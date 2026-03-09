import { createStyles } from "~/theme";

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  standardText: {
    fontSize: 17,
    padding: 6,
    color: colors.surfaceSecondary,
  },
  controlIcon: {
    color: colors.surfaceSecondary,
    width: 30,
  },
  slideBar: {
    flex: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: colors.outline,
  },
  slideCursor: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
}));

export default useStyles;
