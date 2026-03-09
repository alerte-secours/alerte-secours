import React from "react";
import { View } from "react-native";
import Text from "~/components/Text";
import AlertInfoLineAddress from "~/containers/AlertInfoLines/Address";
import AlertInfoLineNear from "~/containers/AlertInfoLines/Near";
import AlertInfoLineW3w from "~/containers/AlertInfoLines/W3w";

/**
 * LocationInfoSection component displays location information with a title
 * and optional address, nearby location, and what3words information.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display for the location section
 * @param {Object} props.alert - Alert object containing location information
 * @param {boolean} [props.showAddress=true] - Whether to show the address information
 * @param {boolean} [props.showNear=true] - Whether to show the nearby location information
 * @param {boolean} [props.showW3w=true] - Whether to show the what3words information
 * @param {Object} props.styles - Styles object containing locationSectionTitle and locationTitle styles
 * @param {boolean} [props.useLastLocation=false] - Whether to use the last known location instead of current location
 * @returns {React.ReactElement} The rendered component
 */
export default function LocationInfoSection({
  title,
  alert,
  showAddress = true,
  showNear = true,
  showW3w = true,
  styles,
  useLastLocation = false,
}) {
  // Create a modified alert object with the appropriate properties
  const displayAlert = useLastLocation
    ? {
        ...alert,
        address: alert.lastAddress,
        nearestPlace: alert.lastNearLocation,
        what3Words: alert.lastWhat3Words,
      }
    : alert;

  return (
    <>
      <View style={styles.locationSectionTitle}>
        <Text style={styles.locationTitle}>{title}</Text>
      </View>
      {showAddress && <AlertInfoLineAddress alert={displayAlert} />}
      {showNear && <AlertInfoLineNear alert={displayAlert} />}
      {showW3w && <AlertInfoLineW3w alert={displayAlert} />}
    </>
  );
}
