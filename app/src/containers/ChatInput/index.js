import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, Alert } from "react-native";
import * as Sentry from "@sentry/react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Device from "expo-device";

import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from "react-native-permissions";

import Countdown from "react-countdown";

import { useAlertState, getLocationState, useSessionState } from "~/stores";
import { useTheme, createStyles } from "~/theme";
import network from "~/network";

import TextArea from "./TextArea";
import useInsertMessage from "~/hooks/useInsertMessage";
import useVoiceRecorder from "~/hooks/useVoiceRecorder";
import { announceForA11y } from "~/lib/a11y";

const MODE = {
  EMPTY: "EMPTY",
  RECORDING: "RECORDING",
  TEXT: "TEXT",
};

const rightButtonIconNames = {
  [MODE.EMPTY]: "microphone",
  [MODE.RECORDING]: "send-circle",
  [MODE.TEXT]: "send-circle",
};

const RECORDING_TIMEOUT = 59;

const activeOpacity = 0.7;

const ensureMicPermission = async () => {
  if (Platform.OS !== "android") {
    return { granted: true, status: RESULTS.UNAVAILABLE };
  }
  try {
    const status = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
    switch (status) {
      case RESULTS.GRANTED:
        return { granted: true, status };
      case RESULTS.DENIED: {
        const r = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        return { granted: r === RESULTS.GRANTED, status: r };
      }
      case RESULTS.BLOCKED:
        return { granted: false, status };
      // NOTE: RESULTS.LIMITED is not applicable to RECORD_AUDIO; treat as not granted.
      case RESULTS.UNAVAILABLE:
      case RESULTS.LIMITED:
      default:
        return { granted: false, status };
    }
  } catch (e) {
    console.log("Mic permission check failed", e);
    return { granted: false, status: undefined };
  }
};

export default React.memo(function ChatInput({
  style,
  labelStyle,
  inputStyle,
  label,
  data: { alertId },
  scrollViewRef,
  ...props
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  const [text, setText] = useState("");
  const textInputRef = useRef(null);
  const { userId, username: sessionUsername } = useSessionState([
    "userId",
    "username",
  ]);
  const username = sessionUsername || "anonyme";

  const { hasMessages } = useAlertState(["hasMessages"]);
  const autoFocus = !hasMessages;

  const [player, setPlayer] = useState(null);
  const requestingMicRef = useRef(false);

  const {
    isRecording: isVoiceRecording,
    uri: recordingUri,
    start: startVoiceRecorder,
    stop: stopVoiceRecorder,
  } = useVoiceRecorder();

  // A11y: avoid repeated announcements while recording (e.g. every countdown tick)
  const lastRecordingAnnouncementRef = useRef(null);

  const insertMessage = useInsertMessage(alertId);

  useEffect(() => {
    return player
      ? () => {
          try {
            player.remove();
          } catch (e) {}
        }
      : undefined;
  }, [player]);

  const hasText = text.length > 0;
  const mode = isVoiceRecording
    ? MODE.RECORDING
    : hasText
    ? MODE.TEXT
    : MODE.EMPTY;

  const sendTextMessage = useCallback(async () => {
    if (!text) {
      return;
    }
    const coords = getLocationState();
    const { latitude, longitude } = coords || {};
    const location =
      latitude && longitude
        ? {
            type: "Point",
            coordinates: [longitude, latitude],
          }
        : null;

    const messageText = text;
    setText("");

    try {
      await insertMessage({
        text: messageText,
        location,
        username,
        userId,
      });

      // Keep focus stable for SR users: after sending, restore focus to the input.
      // (Do not move focus elsewhere; let the user continue typing.)
      setTimeout(() => {
        textInputRef.current?.focus?.();
      }, 0);
    } catch (error) {
      console.error("Failed to send message:", error);
      announceForA11y("Échec de l'envoi du message");
    }
  }, [insertMessage, text, setText, userId, username]);

  const startRecording = useCallback(async () => {
    if (requestingMicRef.current) {
      return;
    }
    requestingMicRef.current = true;
    const startTs = Date.now();
    const logStep = (step, extra) => {
      console.log("[ChatInput] startRecording step", {
        step,
        platform: Platform.OS,
        t: Date.now() - startTs,
        ...(extra ? extra : {}),
      });
    };
    try {
      console.log("[ChatInput] startRecording invoked", {
        platform: Platform.OS,
      });

      if (Platform.OS === "ios" && Device.isDevice === false) {
        Alert.alert(
          "Microphone indisponible",
          "L'enregistrement audio n'est pas supporté sur le simulateur iOS.",
        );
        return;
      }

      logStep("permission:begin");
      console.log("Requesting microphone permission..");
      if (Platform.OS === "android") {
        const { granted, status } = await ensureMicPermission();
        if (!granted) {
          if (status === RESULTS.BLOCKED) {
            try {
              Alert.alert(
                "Autorisation micro bloquée",
                "Veuillez autoriser le micro dans les paramètres de l'application.",
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Ouvrir les paramètres", onPress: openSettings },
                ],
              );
            } catch (_) {}
          } else {
            console.log("Microphone permission not granted", status);
          }
          return;
        }
      } else {
        // iOS microphone permission is handled inside useVoiceRecorder via expo-audio
      }
      logStep("permission:end");

      // stop playback
      if (player !== null) {
        try {
          player.remove();
        } catch (e) {}
        setPlayer(null);
      }

      try {
        console.log(
          "[ChatInput] startRecording delegating to useVoiceRecorder.start",
        );
        logStep("useVoiceRecorder.start:begin");
        await startVoiceRecorder({
          // Android: permission is already handled via react-native-permissions in this component.
          // expo-audio's requestRecordingPermissionsAsync can hang on Android 16.
          skipPermissionRequest: Platform.OS === "android",
        });
        logStep("useVoiceRecorder.start:end");

        // Announce once when recording starts.
        if (lastRecordingAnnouncementRef.current !== "started") {
          lastRecordingAnnouncementRef.current = "started";
          announceForA11y("Enregistrement démarré");
        }
      } catch (error) {
        console.log("error while recording:", error);
        Sentry.captureException(error, {
          tags: {
            feature: "audio-message",
            stage: "startRecording",
          },
          extra: {
            platform: Platform.OS,
            alertId,
            recordingUri,
          },
        });
        announceForA11y("Échec du démarrage de l'enregistrement audio");
        return;
      }
      console.log("[ChatInput] Recording started");
    } catch (err) {
      console.log("Failed to start recording", err);
      Sentry.captureException(err, {
        tags: {
          feature: "audio-message",
          stage: "startRecording-outer",
        },
        extra: {
          platform: Platform.OS,
          alertId,
          recordingUri,
        },
      });
    } finally {
      requestingMicRef.current = false;
    }
  }, [alertId, player, recordingUri, startVoiceRecorder]);

  const stopRecording = useCallback(async () => {
    console.log("[ChatInput] stopRecording invoked", {
      platform: Platform.OS,
      isRecordingBefore: isVoiceRecording,
    });
    let uri = null;
    try {
      uri = await stopVoiceRecorder();
    } catch (_error) {
      // Do nothing -- already stopped/unloaded.
      console.log("[ChatInput] stopVoiceRecorder threw (ignored)", _error);
    }
    const effectiveUri = uri || recordingUri;
    console.log("[ChatInput] stopRecording completed", {
      platform: Platform.OS,
      isRecordingAfter: false,
      recordingUri: effectiveUri,
    });
    if (isVoiceRecording) {
      // Announce once when recording stops.
      if (lastRecordingAnnouncementRef.current !== "stopped") {
        lastRecordingAnnouncementRef.current = "stopped";
        announceForA11y("Enregistrement arrêté");
      }
    }
    return effectiveUri;
  }, [isVoiceRecording, recordingUri, stopVoiceRecorder]);

  const recordedToSound = useCallback(
    async (uriOverride) => {
      console.log("[ChatInput] recordedToSound invoked", {
        platform: Platform.OS,
      });
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          interruptionMode: "doNotMix",
          interruptionModeAndroid: "doNotMix",
          shouldRouteThroughEarpiece: false,
          // Foreground-first: do not keep audio session alive in background.
          shouldPlayInBackground: false,
        });
      } catch (error) {
        console.log(
          "[ChatInput] Audio.setAudioModeAsync for playback failed",
          error,
        );
      }

      const url = uriOverride || recordingUri;
      console.log("[ChatInput] recordedToSound status after recording", {
        platform: Platform.OS,
        url,
      });
      if (url) {
        const _player = createAudioPlayer(url);
        setPlayer(_player);
        console.log("[ChatInput] recordedToSound created player", {
          hasPlayer: !!_player,
        });
      }
    },
    [recordingUri],
  );

  const uploadAudio = useCallback(
    async (uriOverride) => {
      const rawUrl = uriOverride ?? recordingUri ?? null;
      const uri =
        Platform.OS === "ios" && rawUrl && !rawUrl.startsWith("file:")
          ? `file://${rawUrl}`
          : rawUrl;

      console.log("[ChatInput] uploadAudio invoked", {
        platform: Platform.OS,
        recordingUri,
        rawUrl,
        uri,
      });

      if (!uri) {
        const error = new Error("No recording URL available");
        console.error("[ChatInput] uploadAudio error: missing uri", error, {
          platform: Platform.OS,
          recordingUri,
        });
        Sentry.captureException(error, {
          tags: {
            feature: "audio-message",
            stage: "uploadAudio",
          },
          extra: {
            platform: Platform.OS,
            recordingUri,
          },
        });
        throw error;
      }

      const fd = new FormData();
      fd.append("data[alertId]", alertId);
      const fileField = {
        uri,
        // Keep Android behavior, but this remains valid for iOS (AAC in MP4 container).
        type: "audio/mp4",
        name: "audioRecord.m4a",
      };
      console.log("[ChatInput] uploadAudio FormData file field", fileField);
      fd.append("data[file]", fileField);

      try {
        const response = await network.oaFilesKy.post("audio/upload", {
          body: fd,
        });
        console.log("[ChatInput] uploadAudio response", {
          status: response.status,
          statusText: response.statusText,
        });
        return response;
      } catch (error) {
        const statusCode = error?.response?.status;
        const statusText = error?.response?.statusText;
        console.error("[ChatInput] uploadAudio network error", error, {
          platform: Platform.OS,
          statusCode,
          statusText,
        });
        Sentry.captureException(error, {
          tags: {
            feature: "audio-message",
            stage: "uploadAudio",
          },
          extra: {
            platform: Platform.OS,
            statusCode,
            statusText,
            recordingUri,
            uri,
          },
        });
        throw error;
      }
    },
    [alertId, recordingUri],
  );

  const sendRecording = useCallback(async () => {
    try {
      console.log("[ChatInput] sendRecording start", {
        platform: Platform.OS,
      });
      const uri = await stopRecording();
      await recordedToSound(uri);
      await uploadAudio(uri);

      // Keep focus stable: return focus to input after finishing recording flow.
      setTimeout(() => {
        textInputRef.current?.focus?.();
      }, 0);
      console.log("[ChatInput] sendRecording completed successfully");
    } catch (error) {
      const statusCode = error?.response?.status;
      const statusText = error?.response?.statusText;
      console.error("[ChatInput] Failed to send recording", error, {
        platform: Platform.OS,
        statusCode,
        statusText,
      });
      Sentry.captureException(error, {
        tags: {
          feature: "audio-message",
          stage: "sendRecording",
        },
        extra: {
          platform: Platform.OS,
          statusCode,
          statusText,
          alertId,
          recordingUri,
        },
      });
      announceForA11y("Échec de l'envoi de l'enregistrement audio");
    }
  }, [alertId, recordingUri, stopRecording, recordedToSound, uploadAudio]);

  const deleteRecording = useCallback(async () => {
    await stopRecording();
    setTimeout(() => {
      textInputRef.current?.focus?.();
    }, 0);
  }, [stopRecording]);

  const triggerMicrophoneClick = useCallback(async () => {
    if (isVoiceRecording) {
      await sendRecording();
    } else {
      await startRecording();
    }
  }, [isVoiceRecording, startRecording, sendRecording]);

  const onRecordingCountDownComplete = useCallback(async () => {
    await sendRecording();
  }, [sendRecording]);

  // reset on alert change
  const dataRef = useRef(null);
  if (!dataRef.current) {
    dataRef.current = alertId;
  }
  if (dataRef.current !== alertId) {
    dataRef.current = alertId;
    if (hasText) {
      setText("");
    }
    if (mode === MODE.RECORDING) {
      deleteRecording();
    }
  }

  return (
    <View style={[styles.container, style]}>
      {mode === MODE.RECORDING && (
        <View style={styles.exponentContainer}>
          <MaterialCommunityIcons
            size={24}
            style={styles.recordingExponentIcon}
            color={colors.primary}
            name="microphone"
          />
          <Text style={styles.recordingExponentText}>
            Enregistrement audio en cours
          </Text>
        </View>
      )}
      <View>
        <View style={[styles.inputContainer, style]}>
          {(mode === MODE.TEXT || mode === MODE.EMPTY) && (
            <TextArea
              value={text}
              onChangeText={setText}
              autoFocus={autoFocus}
              inputRef={textInputRef}
            />
          )}
          {mode === MODE.RECORDING && (
            <TouchableOpacity
              testID="chat-input-delete-recording"
              accessibilityRole="button"
              accessibilityLabel="Supprimer l'enregistrement"
              accessibilityHint="Supprime l'enregistrement audio. Action destructive."
              accessibilityState={{ disabled: false }}
              activeOpacity={activeOpacity}
              style={styles.deleteButton}
              onPress={deleteRecording}
            >
              <MaterialCommunityIcons
                size={38}
                style={styles.deleteIcon}
                color={colors.primary}
                name="delete-forever"
              />
            </TouchableOpacity>
          )}
          {mode === MODE.RECORDING && (
            <View
              style={styles.countdownContainer}
              accessible
              accessibilityRole="text"
              accessibilityLabel="Compte à rebours avant envoi automatique"
              accessibilityHint="Affiche le temps restant avant l'envoi automatique."
            >
              <Countdown
                autoStart
                date={Date.now() + RECORDING_TIMEOUT * 1000}
                intervalDelay={1000}
                onComplete={onRecordingCountDownComplete}
                renderer={({ seconds }) => (
                  <Text
                    style={styles.countdownText}
                    accessible={false}
                    importantForAccessibility="no"
                  >
                    {seconds || RECORDING_TIMEOUT}
                  </Text>
                )}
              />
              <Text
                style={styles.countdownSubtitle}
                accessible={false}
                importantForAccessibility="no"
              >
                Avant envoi automatique
              </Text>
            </View>
          )}
          <TouchableOpacity
            testID={hasText ? "chat-input-send" : "chat-input-mic"}
            activeOpacity={activeOpacity}
            style={styles.sendButton}
            accessibilityRole="button"
            accessibilityLabel={
              hasText
                ? "Envoyer le message"
                : isVoiceRecording
                ? "Envoyer l'enregistrement audio"
                : "Démarrer l'enregistrement audio"
            }
            accessibilityHint={
              hasText
                ? "Envoie le message."
                : isVoiceRecording
                ? "Envoie l'enregistrement audio."
                : "Démarre l'enregistrement audio."
            }
            accessibilityState={{
              disabled: false,
              ...(isVoiceRecording ? { selected: true } : null),
            }}
            onPress={hasText ? sendTextMessage : triggerMicrophoneClick}
          >
            <MaterialCommunityIcons
              size={38}
              style={styles.sendIcon}
              color={colors.primary}
              name={rightButtonIconNames[mode]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const useStyles = createStyles(({ fontSize, wp, theme: { colors } }) => ({
  container: {
    flex: 1,
    display: "flex",
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    backgroundColor: colors.surface,
    height: "100%",
    paddingLeft: wp(2),
    paddingRight: 0,
  },
  input: {
    flex: 1,
    color: colors.onBackground,
    fontSize: fontSize(14),
    height: "100%",
  },
  countdownContainer: {
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  countdownText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.grey,
    textAlign: "center",
  },
  countdownSubtitle: {
    fontSize: 14,
    textAlign: "center",
    color: colors.grey,
  },
  sendButton: {
    minWidth: 48,
    height: "100%",
    justifyContent: "center",
  },
  deleteButton: {
    minWidth: 48,
    height: "100%",
    justifyContent: "center",
  },
  sendIcon: {},
  deleteIcon: {
    color: colors.grey,
  },
  exponentContainer: {
    position: "absolute",
    top: -48,
    height: 48,
    width: "100%",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingExponentIcon: {
    width: 32,
    height: 32,
    fontSize: 24,
  },
  recordingExponentText: {
    height: 32,
    fontSize: 16,
    color: colors.onSurface,
  },
}));
