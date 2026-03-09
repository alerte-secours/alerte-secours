import React, { useRef, useState, useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";
import { useAudio } from "~/components/AudioProvider";
import playDuration from "~/utils/time/playDuration";

export default function AudioPlayer({ uri }) {
  const styles = useStyles();
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [paused, setPaused] = useState(false);
  const { playSound, pauseSound } = useAudio();

  useEffect(() => {
    return () => {
      pauseSound();
    };
  }, [pauseSound]);

  const [positionInfo, setPositionInfo] = useState({
    duration: 0,
    position: 0,
  });

  const startPlay = async () => {
    setPaused(false);
    setLoadingAudio(true);
    await playSound(uri);
    setLoadingAudio(false);
  };

  const pausePlay = async () => {
    setPaused(true);
    await pauseSound();
  };

  const { position, duration } = positionInfo;
  useEffect(() => {
    if (!(isNaN(position) && isNaN(duration)) && position === duration) {
      setPaused(false);
    }
  }, [position, duration, setPaused]);

  return (
    <View style={styles.container}>
      <View style={styles.audioPlayerContainer}>
        {loadingAudio ? (
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="small" style={styles.loadingButton} />
          </View>
        ) : position > 0 && !paused ? (
          <IconButton
            accessibilityLabel={"Pause"}
            onPress={pausePlay}
            icon={() => (
              <MaterialCommunityIcons
                name="pause-circle-outline"
                size={24}
                style={styles.controlButton}
              />
            )}
          />
        ) : (
          <IconButton
            accessibilityLabel={"Lire"}
            onPress={startPlay}
            icon={() => (
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={24}
                style={styles.controlButton}
              />
            )}
          />
        )}
        <View style={styles.progressIndicatorContainer}>
          <View
            style={[
              styles.progressLine,
              {
                width: `${(position / duration) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.progressDetailsContainer}>
        <Text style={styles.progressDetailsText}>
          {isNaN(position) ? "0" : playDuration(position)} /{" "}
          {isNaN(duration) ? "..." : playDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  loadingIndicatorContainer: {
    padding: 7,
  },
  container: {
    padding: 5,
    width: 250,
  },
  audioPlayerContainer: { flexDirection: "row", alignItems: "center" },
  progressDetailsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  progressDetailsText: {
    paddingHorizontal: 5,
    color: "grey",
    fontSize: 10,
  },
  progressIndicatorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressLine: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loadingButton: {
    color: colors.primary,
  },
  controlButton: {
    color: colors.primary,
  },
}));
