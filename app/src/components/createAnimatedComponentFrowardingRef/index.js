import React, { Component, forwardRef } from "react";
import { Animated } from "react-native";

export default function createAnimatedComponentFrowardingRef(Component) {
  return forwardRef((props, ref) => {
    class Wrapper extends Component {
      render() {
        return <Component {...this.props} ref={ref} />;
      }
    }
    const AnimatedWrapper = Animated.createAnimatedComponent(Wrapper);
    return <AnimatedWrapper {...props} />;
  });
}
