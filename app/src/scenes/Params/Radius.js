import { useCallback, useState, useRef, useEffect } from "react";
import { View } from "react-native";
import { useMutation } from "@apollo/client";
import Slider from "@react-native-community/slider";
import { Title } from "react-native-paper";
import { useSessionState } from "~/stores";

import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";

import { DEVICE_RADIUS_MUTATION } from "./gql";

export default function ParamsRadius({ data }) {
  // const radiusReach
  const { deviceId } = useSessionState(["deviceId"]);
  const [deviceRadiusMutation] = useMutation(DEVICE_RADIUS_MUTATION);

  let { radiusReach, radiusAll } = data.selectOneDevice;
  radiusReach = radiusReach || 0.5;
  radiusAll = radiusAll || 25;

  const [radiusReachState, setRadiusReachState] = useState(radiusReach);
  const [radiusAllState, setRadiusAllState] = useState(radiusAll);
  const prevRadius = useRef({ radiusReach, radiusAll });
  useEffect(() => {
    if (prevRadius.current.radiusReach !== radiusReach) {
      prevRadius.current.radiusReach = radiusReach;
      if (radiusReach !== radiusReachState) {
        setRadiusReachState(radiusReach);
      }
    }
    if (prevRadius.current.radiusAll !== radiusAll) {
      prevRadius.current.radiusAll = radiusAll;
      if (radiusAll !== radiusAllState) {
        setRadiusAllState(radiusAll);
      }
    }
  }, [radiusReach, radiusAll, radiusReachState, radiusAllState]);

  const setDeviceReach = useCallback(
    async (radiusReach) => {
      setRadiusReachState(radiusReach);
      await deviceRadiusMutation({
        variables: {
          deviceId,
          radiusReach,
          radiusAll: Math.max(radiusReach, radiusAllState),
        },
      });
    },
    [deviceRadiusMutation, deviceId, radiusAllState],
  );

  const setDeviceAll = useCallback(
    async (radiusAll) => {
      setRadiusAllState(radiusAll);
      await deviceRadiusMutation({
        variables: {
          deviceId,
          radiusAll,
          radiusReach: Math.min(radiusReachState, radiusAll),
        },
      });
    },
    [deviceId, deviceRadiusMutation, radiusReachState],
  );

  const styles = useStyles();
  const { colors, custom } = useTheme();

  const radiusReachStateDisplay = radiusReachState.toFixed(1);
  const radiusAllStateDisplay = radiusAllState.toFixed(1);

  return (
    <>
      <Title style={styles.title}>Rayon des Alertes</Title>
      <View style={styles.box}>
        <Text style={styles.label}>
          Je souhaite être prévenu de toute alerte dans un rayon de{" "}
          {radiusReachStateDisplay}km
        </Text>

        <View style={styles.sliderContainer}>
          <Slider
            value={radiusReach}
            onValueChange={setRadiusReachState}
            onSlidingComplete={setDeviceReach}
            step={0.5}
            lowerLimit={0.5}
            minimumValue={0}
            maximumValue={25}
            thumbTintColor={colors.primary}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.secondary}
            style={styles.slider}
          />
        </View>
      </View>

      <View style={styles.box}>
        <Text style={styles.label}>
          Si moins de 10 personnes ont pu être prévenu d'une alerte, accepter de
          recevoir ces alertes dans un rayon maximum de {radiusAllStateDisplay}
          km
        </Text>
        <View style={styles.sliderContainer}>
          <Slider
            value={radiusAll}
            onValueChange={setRadiusAllState}
            onSlidingComplete={setDeviceAll}
            step={0.5}
            lowerLimit={0.5}
            minimumValue={0}
            maximumValue={25}
            thumbTintColor={colors.primary}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.secondary}
            style={styles.slider}
          />
        </View>
      </View>
    </>
  );
}

const useStyles = createStyles(({ fontSize }) => ({
  title: { fontSize: 20, fontWeight: "bold", marginVertical: 15 },
  box: { flexDirection: "column", width: "100%" },
  sliderContainer: {
    width: "100%",
    padding: 20,
    marginTop: 15,
    marginBottom: 25,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    height: 40,
  },
  slider: { width: 250, height: 40 },
  label: { fontSize: 18 },
}));
