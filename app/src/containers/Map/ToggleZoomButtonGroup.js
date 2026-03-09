import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { View } from "react-native";
import { ToggleButton } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";
import { useToast } from "~/lib/toast-notifications";

import humanizeDistance from "~/lib/geo/humanizeDistance";
import { createStyles, useTheme } from "~/theme";
import { useSessionState } from "~/stores";

import { BoundType } from "./constants";

import ToggleZoomButton from "./ToggleZoomButton";

export default function ToogleZoomButtonGroup({ boundType, setBoundType }) {
  const { radiusAll, radiusReach } = useSessionState([
    "radiusAll",
    "radiusReach",
  ]);
  const toast = useToast();

  const theme = useTheme();
  const styles = useStyles();

  const touchedBoundTypeRef = useRef(false);
  const zoomToggle = useCallback(
    (value) => {
      touchedBoundTypeRef.current = true;
      switch (value || boundType) {
        case BoundType.NAVIGATION:
          setBoundType(BoundType.TRACK_ALERT_RADIUS_ALL);
          break;
        case BoundType.TRACK_ALERT_RADIUS_ALL:
          setBoundType(BoundType.TRACK_ALERT_RADIUS_REACH);
          break;
        case BoundType.TRACK_ALERT_RADIUS_REACH:
          setBoundType(BoundType.TRACK_ALERTING);
          break;
        case BoundType.TRACK_ALERTING:
          setBoundType(BoundType.NAVIGATION);
          break;
      }
    },
    [boundType, setBoundType],
  );

  const toastOptions = useMemo(
    () => ({
      placement: "top",
      icon: (
        <Entypo
          name="info-with-circle"
          size={14}
          color={theme.colors.primary}
        />
      ),
      animationDuration: 0,
      hideOnPress: true,
    }),
    [theme],
  );

  useEffect(() => {
    if (!touchedBoundTypeRef.current) {
      return;
    }
    let toastId;
    switch (boundType) {
      case BoundType.TRACK_ALERT_RADIUS_ALL:
        toastId = toast.show(
          `Rayon dans lequel vous recevez toutes les alertes, paramétré à ${humanizeDistance(
            radiusAll,
          )}`,
          toastOptions,
        );
        break;
      case BoundType.TRACK_ALERT_RADIUS_REACH:
        toastId = toast.show(
          `Rayon des alertes n'ayant réussi à contacter personne de plus proche, paramétré à ${humanizeDistance(
            radiusReach,
          )}`,
          toastOptions,
        );
        break;
      case BoundType.TRACK_ALERTING:
        toastId = toast.show(
          `Rayon incluant toutes vos alertes en cours`,
          toastOptions,
        );
        break;
    }
    return () => {
      // toast.hide(toastId);
    };
  }, [
    boundType,
    radiusAll,
    radiusReach,
    toast,
    toastOptions,
    touchedBoundTypeRef,
  ]);

  return (
    <>
      <View style={styles.boundTypeButtonGroup}>
        <ToggleButton.Group
          onValueChange={zoomToggle}
          value={boundType}
          accessibilityRole="radiogroup"
          accessibilityLabel="Mode d'affichage de la carte"
          accessibilityHint="Change le mode d'affichage de la carte."
        >
          <ToggleZoomButton
            value={BoundType.TRACK_ALERT_RADIUS_ALL}
            selected={boundType}
            iconName={"map-marker"}
          />
          <ToggleZoomButton
            value={BoundType.TRACK_ALERT_RADIUS_REACH}
            selected={boundType}
            iconName={"map-marker-radius"}
          />
          <ToggleZoomButton
            value={BoundType.TRACK_ALERTING}
            selected={boundType}
            iconName={"map-marker-circle"}
          />
          <ToggleZoomButton
            value={BoundType.NAVIGATION}
            selected={boundType}
            iconName={"navigation-variant-outline"}
          />
        </ToggleButton.Group>
      </View>
    </>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  boundTypeButtonGroup: {
    position: "absolute",
    bottom: 72,
    right: 4,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
}));
