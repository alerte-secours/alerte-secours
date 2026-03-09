import React from "react";
import { createStyles } from "~/theme";
import AudioSlider from "~/lib/expo-audio-player";
import { useAudio } from "~/components/AudioProvider";

export default function AudioPlayer({ uri }) {
  const styles = useStyles();
  const registry = useAudio();
  return <AudioSlider audio={uri} registry={registry} style={styles} />;
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  standardText: {
    fontSize: 17,
    padding: 6,
    color: colors.primary,
  },
  controlIcon: {
    color: colors.primary,
  },
  slideCursor: {
    backgroundColor: colors.blueLight,
  },
  slideBar: {
    backgroundColor: colors.blue,
  },
}));
