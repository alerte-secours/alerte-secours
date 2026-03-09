import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioRecorder,
} from "expo-audio";

let hasLoggedAudioMode = false;

const nowMs = () => Date.now();

const debugLog = (...args) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

const withTimeout = async (promise, timeoutMs, label) => {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `[useVoiceRecorder] timeout in ${label} after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);
  });
  try {
    // race between actual promise and timeout
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const waitForAppActive = async (timeoutMs) => {
  if (AppState.currentState === "active") {
    return;
  }

  let sub;
  let timeoutId;
  try {
    await new Promise((resolve, reject) => {
      if (timeoutMs && timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `[useVoiceRecorder] timeout in waitForAppActive after ${timeoutMs}ms`,
            ),
          );
        }, timeoutMs);
      }

      sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          resolve();
        }
      });
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    try {
      sub?.remove?.();
    } catch (_e) {}
  }
};

const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export default function useVoiceRecorder() {
  const recorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uri, setUri] = useState(null);

  // Used to cancel stale/blocked starts so they cannot complete later
  // (e.g. after a background->foreground transition).
  const startAttemptRef = useRef(0);

  // NOTE: `expo-audio` doesn't export `AudioRecorder` as a runtime JS class.
  // The supported API is `useAudioRecorder`, which returns a native-backed SharedObject.
  const preset =
    RecordingPresets?.HIGH_QUALITY || RecordingPresets?.LOW_QUALITY;
  if (!preset) {
    throw new Error(
      "expo-audio RecordingPresets are not available; cannot start recording",
    );
  }
  const recorder = useAudioRecorder({
    ...preset,
    isMeteringEnabled: true,
  });

  useEffect(() => {
    recorderRef.current = recorder;
    return () => {
      if (recorderRef.current === recorder) {
        recorderRef.current = null;
      }
    };
  }, [recorder]);

  const cleanupRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (recorder) {
      try {
        if (recorder.isRecording) {
          await recorder.stop();
        }
      } catch (_e) {
        // no-op
      }
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(
    async (options) => {
      const opts = options || {};
      const attemptId = ++startAttemptRef.current;
      const attemptStart = nowMs();
      const logStep = (step, extra) => {
        debugLog("[useVoiceRecorder] start step", {
          step,
          platform: Platform.OS,
          attemptId,
          t: nowMs() - attemptStart,
          ...(extra ? extra : {}),
        });
      };
      const assertNotCancelled = () => {
        if (startAttemptRef.current !== attemptId) {
          const err = new Error(
            "[useVoiceRecorder] start cancelled/superseded",
          );
          err.__CANCELLED__ = true;
          throw err;
        }
      };

      // Reset any previous recording before starting a new one
      await cleanupRecording();
      setUri(null);

      // If the app is not active, do not attempt a start (it may complete later unexpectedly).
      // This is especially important on Android where audio focus can be deferred.
      if (Platform.OS === "android") {
        logStep("waitForAppActive:begin", { appState: AppState.currentState });
        await waitForAppActive(2500).catch((_e) => {
          // If we cannot become active quickly, abort this start.
        });
        assertNotCancelled();
        logStep("waitForAppActive:end", { appState: AppState.currentState });

        if (AppState.currentState !== "active") {
          throw new Error("[useVoiceRecorder] start aborted: app not active");
        }

        // Yield one frame to ensure the permission dialog/gesture cycle has fully finished.
        await nextFrame();
        assertNotCancelled();
      }

      // Permissions
      // - iOS: expo-audio permission API is the single source of truth.
      // - Android: the app already requests RECORD_AUDIO via react-native-permissions
      //   in [`startRecording()`](src/containers/ChatInput/index.js:161).
      //   On Android 16 we observed `requestRecordingPermissionsAsync()` can hang,
      //   so we allow skipping it.
      if (Platform.OS === "android" && opts.skipPermissionRequest === true) {
        logStep("permissions:skipped");
      } else {
        logStep("permissions:begin");
        const permission = await withTimeout(
          requestRecordingPermissionsAsync(),
          // iOS can sometimes take time if the system dialog appears; keep no timeout.
          Platform.OS === "android" ? 4000 : 0,
          "requestRecordingPermissionsAsync",
        );
        logStep("permissions:end", { granted: !!permission?.granted });
        if (!permission?.granted) {
          throw new Error("Microphone permission not granted");
        }
      }
      assertNotCancelled();

      // Configure audio mode for recording (iOS & Android)
      const recordingAudioMode = {
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
        interruptionModeAndroid: "doNotMix",
        shouldRouteThroughEarpiece: false,
        // Foreground-first: keep the audio session inactive in background.
        shouldPlayInBackground: false,
      };

      if (!hasLoggedAudioMode) {
        debugLog("[useVoiceRecorder] audio mode set", recordingAudioMode);
        hasLoggedAudioMode = true;
      }

      logStep("setAudioModeAsync:begin");
      await withTimeout(
        setAudioModeAsync(recordingAudioMode),
        Platform.OS === "android" ? 4000 : 0,
        "setAudioModeAsync",
      );
      logStep("setAudioModeAsync:end");
      assertNotCancelled();

      const prepareAndStart = async () => {
        logStep("setIsAudioActiveAsync:begin");
        await withTimeout(
          setIsAudioActiveAsync(true).catch(() => {}),
          Platform.OS === "android" ? 4000 : 0,
          "setIsAudioActiveAsync",
        );
        logStep("setIsAudioActiveAsync:end");
        assertNotCancelled();

        debugLog("[useVoiceRecorder] preparing recorder");
        logStep("prepareToRecordAsync:begin");
        await withTimeout(
          recorder.prepareToRecordAsync(),
          Platform.OS === "android" ? 7000 : 0,
          "prepareToRecordAsync",
        );
        logStep("prepareToRecordAsync:end");
        assertNotCancelled();

        debugLog("[useVoiceRecorder] starting recorder");
        logStep("record:invoke");
        recorder.record();

        // Some Android versions may take a moment to flip the native state.
        // Avoid marking isRecording true until the recorder actually reports recording.
        if (Platform.OS === "android") {
          const startWait = nowMs();
          while (nowMs() - startWait < 800) {
            assertNotCancelled();
            if (recorder.isRecording) {
              break;
            }
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 50));
          }
        }

        assertNotCancelled();
        setIsRecording(true);
        logStep("record:started", { isRecording: !!recorder.isRecording });
      };
      try {
        await prepareAndStart();
      } catch (error) {
        debugLog("[useVoiceRecorder] recorder start failed", error);

        // One controlled retry for iOS: reset the audio session and try once more.
        try {
          await cleanupRecording();
          await setAudioModeAsync(recordingAudioMode);
          await new Promise((r) => setTimeout(r, 150));
          await prepareAndStart();
          return;
        } catch (_retryError) {
          debugLog("[useVoiceRecorder] recorder retry failed", _retryError);
        }

        // One controlled retry for Android if we hit a timeout/hang.
        // This prevents a later background->foreground from completing the old attempt.
        if (Platform.OS === "android") {
          try {
            startAttemptRef.current = attemptId; // keep attempt active for the retry
            await cleanupRecording();
            await new Promise((r) => setTimeout(r, 200));
            assertNotCancelled();
            logStep("androidRetry:begin");
            await prepareAndStart();
            logStep("androidRetry:success");
            return;
          } catch (_androidRetryError) {
            debugLog(
              "[useVoiceRecorder] android retry failed",
              _androidRetryError,
            );
          }
        }

        try {
          if (recorderRef.current?.isRecording) {
            await recorderRef.current.stop();
          }
        } catch (_e) {
          // ignore cleanup failures
        } finally {
          // keep recorder instance; hook will manage its lifecycle
          setIsRecording(false);
        }
        throw error;
      }
    },
    [cleanupRecording, recorder],
  );

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      setIsRecording(false);
      return null;
    }

    try {
      await recorder.stop();
    } catch (_e) {
      // ignore errors from already-stopped/unloaded recordings
    }

    const recordingUri = recorder.uri;
    setUri(recordingUri ?? null);
    setIsRecording(false);
    return recordingUri ?? null;
  }, []);

  const reset = useCallback(() => {
    setUri(null);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    // Cancel any pending start when the app transitions away from active.
    // This prevents a stalled promise from completing later and starting recording unexpectedly.
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS === "android") {
        // Android: cancel on any transition away from active (prevents delayed auto-start).
        if (state !== "active") {
          startAttemptRef.current += 1;
        }
      } else {
        // iOS: permission prompts commonly put the app into `inactive` temporarily.
        // Cancelling on `inactive` breaks first-run permission flow.
        // Only cancel when truly backgrounded.
        if (state === "background") {
          startAttemptRef.current += 1;
        }
      }
    });
    return () => {
      try {
        sub.remove();
      } catch (_e) {}
      const recorder = recorderRef.current;
      if (recorder) {
        if (recorder.isRecording) {
          recorder.stop().catch(() => {});
        }
      }
    };
  }, []);

  return {
    isRecording,
    uri,
    start,
    stop,
    reset,
  };
}
