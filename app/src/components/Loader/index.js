import React from "react";

import {
  View,
  // ActivityIndicator,
  StyleSheet,
} from "react-native";
import LottieView from "lottie-react-native";

const loaderSource = require("~/assets/animation/loader.json");

export default function Loader({ containerProps = {}, ...props }) {
  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      {/* <ActivityIndicator /> */}
      <LottieView
        source={loaderSource}
        style={styles.lottie}
        autoPlay
        loop
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
