import { Popup } from "react-native-map-link";
import { Platform } from "react-native";

export default function MapLinksPopup({
  isVisible,
  setIsVisible,
  options = {},
  ...extraProps
}) {
  const { longitude, latitude, ...restOptions } = options;
  if (!longitude || !latitude) {
    return null;
  }
  return (
    <Popup
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      onCancelPressed={() => setIsVisible(false)}
      onAppPressed={() => setIsVisible(false)}
      onBackButtonPressed={() => setIsVisible(false)}
      modalProps={{
        animationType: "slide",
      }}
      options={{
        latitude,
        longitude,
        naverCallerName:
          Platform.OS === "ios"
            ? "com.alertesecours.alertesecours"
            : "com.alertesecours",
        dialogTitle:
          "Ouvrir l'emplacement de l'alerte dans une application de navigation",
        dialogMessage: "Quelle application souhaitez vous utiliser ?",
        cancelText: "Annuler",
        alwaysIncludeGoogle: true,
        ...restOptions,
      }}
      {...extraProps}
    />
  );
}
