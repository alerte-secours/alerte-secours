import Maplibre, { Logger } from "@maplibre/maplibre-react-native";

// edit logging messages
Logger.setLogCallback((log) => {
  const { message } = log;

  // expected warnings - see https://github.com/mapbox/mapbox-gl-native/issues/15341#issuecomment-522889062
  if (
    message.match("Request failed due to a permanent error: Canceled") ||
    message.match("Request failed due to a permanent error: Socket Closed")
  ) {
    return true;
  }
  return false;
});

// https://github.com/react-native-mapbox-gl/maps/blob/master/docs/Maplibre.md#arguments
Maplibre.setAccessToken(null);
