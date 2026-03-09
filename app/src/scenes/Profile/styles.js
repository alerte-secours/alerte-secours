import { createStyles } from "~/theme";

export const useStyles = createStyles(({ theme: { colors } }) => ({
  textInput: {
    backgroundColor: colors.surface,
    marginVertical: 5,
  },
  formButton: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 45,
    justifyContent: "center",
  },
  bottomModalContentContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    position: "absolute",
    width: "100%",
    bottom: 0,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
  },
  buttonIcon: {
    color: colors.onPrimary,
  },
}));
