import { createStyles } from "~/theme";

import { View } from "react-native";
import Text from "~/components/Text";

export default function SectionSeparator({ label }) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: colors.background,
    borderTopWidth: 0.2,
    borderBottomWidth: 0.2,
    borderTopColor: colors.grey,
    borderBottomColor: colors.grey,
  },
  labelText: {
    fontSize: 14,
    // fontWeight: "bold",
    // textDecorationLine: "underline",
    color: colors.onBackground,
    width: "100%",
    textAlign: "center",
  },
}));
