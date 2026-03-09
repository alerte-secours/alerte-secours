import { createStyles } from "~/theme";

const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  subtitleContainer: {
    marginTop: 5,
    paddingVertical: 10,
  },
  subtitleText: {
    fontSize: 17,
    textAlign: "center",
    color: colors.primary,
  },
}));

export default useStyles;
