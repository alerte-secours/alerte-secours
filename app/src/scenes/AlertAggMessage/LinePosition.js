import React from "react";

import humanizeDistance from "~/lib/geo/humanizeDistance";
import { createStyles } from "~/theme";
import Text from "~/components/Text";

export default function LinePosition({ distance }) {
  const styles = useStyles();

  const distanceText =
    typeof distance === "number" ? humanizeDistance(distance) : "";

  return (
    <Text style={styles.text}>
      à <Text style={{ fontWeight: "bold" }}>{distanceText}</Text> de votre
      position actuelle
    </Text>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  text: {
    paddingVertical: 2,
    fontSize: 13,
  },
}));
