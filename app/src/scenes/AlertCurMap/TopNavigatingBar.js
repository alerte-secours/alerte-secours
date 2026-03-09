import React from "react";
import { StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";

import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

export default function TopNavigatingBar({ isFlipped, setIsFlipped }) {
  // const styles = useStyles();

  return (
    <Appbar style={styles.bottom}>
      {isFlipped && (
        <Appbar.Action
          icon={() => <FontAwesome5 name="route" size={24} />}
          onPress={() => setIsFlipped(false)}
        />
      )}
      {!isFlipped && (
        <Appbar.Action
          icon={() => <MaterialCommunityIcons name="routes" size={24} />}
          onPress={() => setIsFlipped(true)}
        />
      )}
    </Appbar>
  );
}

// const useStyles = createStyles(
//   ({ wp, hp, scaleText, theme: { colors } }) => ({})
// );
const styles = StyleSheet.create({
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
});
