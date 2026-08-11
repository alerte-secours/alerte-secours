import React from "react";
import { Animated } from "react-native";
// import createAnimatedComponentFrowardingRef from "~/components/createAnimatedComponentFrowardingRef";
import * as Maplibre from "@maplibre/maplibre-react-native";

const styles = {
  innerCircle: {
    circleColor: "white",
    circleStrokeWidth: 1,
    circleStrokeColor: "#c6d2e1",
  },
  innerCirclePulse: {
    // circleColor: "#4264fb",
    circleColor: "rgba(51, 181, 229, 20)",
    circleStrokeColor: "#c6d2e1",
    circleStrokeWidth: 1,
  },
  outerCircle: {
    circleOpacity: 0.4,
    circleColor: "#c6d2e1",
  },
};

class ShapeUserPulse extends React.Component {
  static defaultProps = {
    radius: 9,
    innerRadius: 6,
    pulseRadius: 30,
    duration: 1000,
  };

  constructor(props) {
    super(props);

    this.state = {
      innerRadius: new Animated.Value(props.innerRadius),
      pulseOpacity: new Animated.Value(1),
      pulseRadius: new Animated.Value(props.radius),
    };

    this._loopAnim = null;
  }

  componentDidMount() {
    const expandOutAnim = Animated.parallel([
      Animated.timing(this.state.pulseOpacity, {
        toValue: 0,
        duration: this.props.duration,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.pulseRadius, {
        toValue: this.props.pulseRadius,
        duration: this.props.duration,
        useNativeDriver: false,
      }),
      // Animated.timing(this.state.innerRadius, {
      //   toValue: this.props.radius * 0.7,
      //   duration: this.props.duration / 2,
      //   useNativeDriver: false,
      // }),
    ]);

    const shrinkInAnim = Animated.parallel([
      Animated.timing(this.state.pulseRadius, {
        toValue: this.props.radius,
        duration: this.props.duration / 2,
        useNativeDriver: false,
      }),
      // Animated.timing(this.state.innerRadius, {
      //   toValue: this.props.radius * 0.5,
      //   duration: this.props.duration / 2,
      //   useNativeDriver: false,
      // }),
    ]);

    this._loopAnim = Animated.loop(
      Animated.sequence([expandOutAnim, shrinkInAnim]),
    );

    // DISABLE FOR DEV IN EMULAOTR (high CPU)
    // this._loopAnim.start(() => {
    //   this.setState({ pulseOpacity: 1 });
    // });
  }

  componentWillUnmount() {
    this.stop();
  }

  stop() {
    this._loopAnim.stop();
  }

  render() {
    if (!this.props.shape) {
      return null;
    }

    const innerCircleStyle = [
      styles.innerCircle,
      this.props.innerCircleStyle,
      { circleRadius: this.props.radius },
    ];

    const innerCirclePulseStyle = [
      styles.innerCirclePulse,
      { circleRadius: this.state.innerRadius },
    ];

    const outerCircleStyle = [
      styles.outerCircle,
      this.props.outerCircleStyle,
      {
        circleRadius: this.state.pulseRadius,
        circleOpacity: this.state.pulseOpacity,
      },
    ];

    return (
      <Maplibre.Animated.GeoJSONSource
        id="pulseCircleSource"
        data={this.props.shape}
      >
        <Maplibre.Animated.Layer
          type="circle"
          id="pulseOuterCircle"
          style={outerCircleStyle}
          afterId={this.props.aboveLayerID}
        />
        <Maplibre.Animated.Layer
          type="circle"
          id="pulseInnerCircleCnt"
          style={innerCircleStyle}
          afterId="pulseOuterCircle"
        />
        <Maplibre.Animated.Layer
          type="circle"
          id="pulseInnerCircle"
          style={innerCirclePulseStyle}
          afterId="pulseInnerCircleCnt"
        />
      </Maplibre.Animated.GeoJSONSource>
    );
  }
}

export default Animated.createAnimatedComponent(ShapeUserPulse);
// export default createAnimatedComponentFrowardingRef(ShapeUserPulse);
