import React, { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, Animated, PanResponder, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DigitalTimeString from "./DigitalTimeString";

import useStyles from "./styles";
import withHooks from "~/hoc/withHooks";
import IconTouchTarget from "~/components/IconTouchTarget";

const TRACK_SIZE = 4;
const THUMB_SIZE = 20;

function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

function AudioSlider(props) {
  // Props mapping (kept compatible with previous class component)
  const { audio: audioUrl, registry, style: styleProp } = props;
  const pauseAllBeforePlay =
    props.pauseAllBeforePlay === undefined ? true : props.pauseAllBeforePlay;

  // Styles injected by withHooks HOC
  const styles = props.styles;

  // Track layout (for computing pixel & time mappings)
  const [trackLayout, setTrackLayout] = useState({ width: 0, height: 0 });

  // Thumb X position (in pixels) — single Animated.Value used both for dragging and syncing to playback
  const dotX = useRef(new Animated.Value(0)).current;
  const isDraggingRef = useRef(false);
  const xDotOffsetAtStartRef = useRef(0);

  // While dragging, we derive the current time from the thumb position for live display
  const [dragTimeMs, setDragTimeMs] = useState(0);

  // Player using new expo-audio hook API
  const player = useAudioPlayer(audioUrl, 250);
  const status = useAudioPlayerStatus(player) || {};

  const durationSec = status.duration || 0;
  const currentTimeSec = status.currentTime || 0;

  // Register in an optional registry to allow pausing other players before play
  const selfRef = useRef({
    pause: () => {
      try {
        player.pause();
      } catch {}
    },
  });

  useEffect(() => {
    selfRef.current.pause = () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  useEffect(() => {
    if (!registry) return;
    const self = selfRef.current;
    registry.register(self);
    return () => {
      try {
        registry.unregister(self);
      } catch {}
    };
  }, [registry]);

  // Ensure no looping (mimics the previous behavior)
  useEffect(() => {
    try {
      player.loop = false;
    } catch {}
  }, [player]);

  // When not dragging, keep the thumb in sync with the playback position
  useEffect(() => {
    if (!isDraggingRef.current) {
      const w = trackLayout.width || 0;
      const x = durationSec > 0 ? (currentTimeSec / durationSec) * w : 0;
      dotX.setValue(x);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTimeSec, durationSec, trackLayout.width]);

  // When playback finishes, reset to start (seek to 0 and move thumb to start)
  useEffect(() => {
    if (status.didJustFinish) {
      try {
        player.pause();
      } catch {}
      try {
        player.seekTo(0);
      } catch {}
      dotX.setValue(0);
    }
  }, [status.didJustFinish, player, dotX]);

  // Safety: if we detect playback reached or passed the end, stop and reset
  useEffect(() => {
    if (durationSec > 0 && currentTimeSec >= durationSec - 0.05) {
      try {
        player.pause();
      } catch {}
      try {
        player.seekTo(0);
      } catch {}
      dotX.setValue(0);
    }
  }, [currentTimeSec, durationSec, player, dotX]);

  const onPressPlayPause = async () => {
    if (status.playing) {
      try {
        player.pause();
      } catch {}
      return;
    }

    // Pause others first if asked
    if (registry && pauseAllBeforePlay) {
      try {
        const players = registry.getAll ? registry.getAll() : [];
        players
          .filter((p) => p !== selfRef.current && typeof p.pause === "function")
          .forEach((p) => p.pause());
      } catch {}
    }

    try {
      if (durationSec > 0 && currentTimeSec >= durationSec - 0.05) {
        await player.seekTo(0);
      }
      player.play();
    } catch {}
  };

  const a11yPlayPauseLabel = status.playing
    ? "Mettre en pause"
    : "Lire le message audio";
  const a11yPlayPauseHint = status.playing
    ? "Met en pause la lecture."
    : "Démarre la lecture du message audio.";

  // Pan handling for seeking
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,

        onPanResponderGrant: async () => {
          // Pause if currently playing (mimic previous behavior)
          if (status.playing) {
            try {
              player.pause();
            } catch {}
          }

          isDraggingRef.current = true;

          // Initialize offset for drag
          const currentX = dotX.__getValue();
          xDotOffsetAtStartRef.current = currentX;
          dotX.setOffset(currentX);
          dotX.setValue(0);

          // While dragging, update displayed time
          dotX.addListener(({ value }) => {
            const w = trackLayout.width || 1;
            const currentOffset =
              xDotOffsetAtStartRef.current +
              (typeof value === "number" ? value : 0);
            const clampedX = clamp(currentOffset, 0, w);
            const percent = w > 0 ? clampedX / w : 0;
            const ms = Math.round(percent * durationSec * 1000);
            setDragTimeMs(ms);
          });
        },

        onPanResponderMove: Animated.event([null, { dx: dotX }], {
          useNativeDriver: false,
        }),

        onPanResponderTerminationRequest: () => false,

        onPanResponderTerminate: async () => {
          // Another component took the responder
          dotX.removeAllListeners();

          const w = trackLayout.width || 1;
          const value = dotX.__getValue();
          const currentOffset =
            xDotOffsetAtStartRef.current +
            (typeof value === "number" ? value : 0);

          let clampedX = clamp(currentOffset, 0, w);
          dotX.flattenOffset();
          dotX.setValue(clampedX);

          if (durationSec > 0) {
            const targetSec = (clampedX / w) * durationSec;
            try {
              await player.seekTo(targetSec);
            } catch {}
          }

          isDraggingRef.current = false;
          setDragTimeMs(0);
        },

        onPanResponderRelease: async () => {
          dotX.removeAllListeners();

          const w = trackLayout.width || 1;
          const value = dotX.__getValue();
          const currentOffset =
            xDotOffsetAtStartRef.current +
            (typeof value === "number" ? value : 0);

          let clampedX = clamp(currentOffset, 0, w);
          dotX.flattenOffset();
          dotX.setValue(clampedX);

          if (durationSec > 0) {
            const targetSec = (clampedX / w) * durationSec;
            try {
              await player.seekTo(targetSec);
            } catch {}
          }

          isDraggingRef.current = false;
          setDragTimeMs(0);
        },
      }),
    [dotX, durationSec, player, status.playing, trackLayout.width],
  );

  const measureTrack = (event) => {
    setTrackLayout(event.nativeEvent.layout || {});
  };

  // Times for display (DigitalTimeString expects milliseconds)
  const durationMs = Math.round(durationSec * 1000);
  const currentTimeMs = isDraggingRef.current
    ? dragTimeMs
    : Math.round(currentTimeSec * 1000);

  return (
    <View
      style={{
        flex: 0,
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <View
        style={{
          flex: 0,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: 8,
          paddingRight: 8,
          height: 35,
        }}
      >
        <TouchableOpacity
          // Make this wrapper non-accessible to avoid a duplicate SR target.
          // The interactive, labeled touch target is provided by IconTouchTarget below.
          accessible={false}
          importantForAccessibility="no"
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingRight: THUMB_SIZE,
            zIndex: 2,
          }}
          onPress={onPressPlayPause}
        >
          {status.playing ? (
            <MaterialCommunityIcons
              name="pause-circle-outline"
              size={30}
              style={[styles.controlIcon, styleProp?.controlIcon]}
            />
          ) : (
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={30}
              style={[styles.controlIcon, styleProp?.controlIcon]}
            />
          )}
        </TouchableOpacity>

        {/* A11y: ensure minimum touch target and stateful labels for SR users */}
        <IconTouchTarget
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 44,
            zIndex: 3,
          }}
          accessibilityLabel={a11yPlayPauseLabel}
          accessibilityHint={a11yPlayPauseHint}
          accessibilityState={{ selected: !!status.playing }}
          onPress={onPressPlayPause}
        />

        <Animated.View
          onLayout={measureTrack}
          style={[
            styles.slideBar,
            styleProp?.slideBar,
            {
              height: TRACK_SIZE,
              borderRadius: TRACK_SIZE / 2,
            },
          ]}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Position de lecture"
          accessibilityHint="Faites glisser pour avancer ou reculer dans le message audio."
        >
          <Animated.View
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              left: -((THUMB_SIZE * 4) / 2),
              width: THUMB_SIZE * 4,
              height: THUMB_SIZE * 4,
              transform: [{ translateX: dotX }],
            }}
            {...panResponder.panHandlers}
          >
            <View
              style={[
                styles.slideCursor,
                styleProp?.slideCursor,
                {
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_SIZE / 2,
                },
              ]}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <View
        style={{
          flex: 0,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DigitalTimeString time={currentTimeMs} style={styleProp} />
        <DigitalTimeString time={durationMs} style={styleProp} />
      </View>
    </View>
  );
}

export default withHooks(AudioSlider, () => {
  const styles = useStyles();
  return { styles };
});
