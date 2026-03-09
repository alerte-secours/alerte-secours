import { LogBox } from "react-native";

if (__DEV__ || process.env.NODE_ENV !== "production") {
  global.redlog = (...args) => console.log("\x1b[31m%s\x1b[0m", ...args);

  const ignoreLogs = [
    // see https://github.com/transistorsoft/react-native-background-geolocation/issues/748
    /^.*HttpService is busy.*$/,
    /^.*Unhandled Promise Rejection.*"499".*$/,
    // see https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/#reduced-motion-setting-is-enabled-on-this-device
    /^.*\[Reanimated\] Reduced motion setting is enabled on this device.*$/,
    // see https://github.com/getsentry/sentry-react-native/issues/4164
    "Sentry Logger [warn]: [ReactNativeTracing] Not instrumenting App Start because native returned null.",
    "Sentry Logger [warn]:",
  ];

  LogBox.ignoreLogs(ignoreLogs);

  const originalConsoleWarn = console.warn.bind(console);
  console.warn = (message) => {
    for (const ignore of ignoreLogs) {
      if (
        (typeof ignore === "string" && ignore === message) ||
        (ignore instanceof RegExp && ignore.test(message))
      ) {
        return;
      }
    }
    return originalConsoleWarn(message);
  };
}
