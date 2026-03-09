import React, { useMemo, useEffect, useState } from "react";
import { View, ScrollView, AppState } from "react-native";
import { Title, Button } from "react-native-paper";
import Text from "~/components/Text";
import { OpenLocationCode } from "open-location-code";
import { useQuery } from "@apollo/client";
import * as Location from "expo-location";

import useLocation from "~/hooks/useLocation";
import getTimeDisplay from "~/utils/time/getTimeDisplay";
import requestPermissionLocationForeground from "~/permissions/requestPermissionLocationForeground";
import openSettings from "~/lib/native/openSettings";

import { QUERY_GET_WHAT3WORDS, QUERY_GET_NOMINATIM } from "./gql";
import LittleLoader from "~/components/LittleLoader";
import { createStyles } from "~/theme";
import Loader from "~/components/Loader";
import MapLinksButton from "~/containers/MapLinksButton";

export default function LocationScene() {
  const openLocationCode = useMemo(() => new OpenLocationCode(), []);
  const { coords, isLastKnown, lastKnownTimestamp, reload } = useLocation();
  const [permissionStatus, setPermissionStatus] = useState(null);

  const { latitude, longitude } = coords;

  const plusCode = useMemo(() => {
    if (latitude && longitude) {
      return openLocationCode.encode(latitude, longitude);
    }
    return null;
  }, [latitude, longitude, openLocationCode]);

  const queryWhat3words = useQuery(QUERY_GET_WHAT3WORDS, {
    variables: { latitude, longitude },
    skip: !(latitude && longitude),
  });
  const queryNominatim = useQuery(QUERY_GET_NOMINATIM, {
    variables: { latitude, longitude },
    skip: !(latitude && longitude),
  });

  const words = useMemo(() => {
    return queryWhat3words.data?.getOneInfoWhat3Words.words || "-";
  }, [queryWhat3words.data]);
  const nearestPlace = useMemo(() => {
    if (queryWhat3words.data) {
      return queryWhat3words.data?.getOneInfoWhat3Words.nearestPlace || "-";
    }
  }, [queryWhat3words.data]);
  const address = useMemo(() => {
    return queryNominatim.data?.getOneInfoNominatim.address || "-";
  }, [queryNominatim.data]);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status === "granted");
  };

  // Check permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Recheck permissions and reload location when app comes to foreground
        checkLocationPermission();
        reload?.();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reload]);

  const styles = useStyles();

  if (!(latitude && longitude)) {
    return <Loader />;
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container}>
        <Title style={styles.title}>Ma Localisation</Title>
        {isLastKnown && (
          <View style={styles.lastKnownContainer}>
            <Text style={styles.lastKnownText}>
              Dernière position connue {getTimeDisplay(lastKnownTimestamp)}
            </Text>
          </View>
        )}
        <View style={styles.coordsContainer}>
          <View style={styles.coordsRow}>
            <Text style={styles.coordsRowLabel}>En 3 mots : </Text>
            {queryWhat3words.loading && <LittleLoader style={styles.loader} />}
            {!queryWhat3words.loading && words && (
              <Text style={styles.coordRowValue}>{words}</Text>
            )}
          </View>
          {plusCode && (
            <View style={styles.coordsRow}>
              <Text style={styles.coordsRowLabel}>Plus Code : </Text>
              <Text style={styles.coordRowValue}>{plusCode}</Text>
            </View>
          )}
          <View style={styles.coordsRow}>
            <Text style={styles.coordsRowLabel}>Latitude : </Text>
            <Text style={styles.coordRowValue}>{latitude}</Text>
          </View>
          <View style={styles.coordsRow}>
            <Text style={styles.coordsRowLabel}>Longitude : </Text>
            <Text style={styles.coordRowValue}>{longitude}</Text>
          </View>
          <View style={styles.coordsRow}>
            <Text style={styles.coordsRowLabel}>Adresse : </Text>
            {queryNominatim.loading && <LittleLoader style={styles.loader} />}
            {!queryNominatim.loading && address && (
              <Text style={styles.coordRowValue}>{address}</Text>
            )}
          </View>
          <View style={styles.coordsRow}>
            <Text style={styles.coordsRowLabel}>À proximité de : </Text>
            {queryWhat3words.loading && <LittleLoader style={styles.loader} />}
            {!queryWhat3words.loading && nearestPlace && (
              <Text style={styles.coordRowValue}>{nearestPlace}</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomButtonsContainer}>
          {permissionStatus === false && (
            <View style={styles.permissionButtonsContainer}>
              <Text style={styles.permissionText}>
                Pour utiliser la localisation, veuillez autoriser l'accès. Si la
                demande directe ne fonctionne pas, vous devrez activer
                manuellement la permission dans les paramètres de l'appareil.
              </Text>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={requestPermissionLocationForeground}
                  style={styles.button}
                >
                  Autoriser la localisation
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={openSettings}
                  style={styles.button}
                >
                  Ouvrir les paramètres
                </Button>
              </View>
            </View>
          )}
          <MapLinksButton coordinates={[longitude, latitude]} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  root: {
    height: "100%",
  },
  container: {
    marginVertical: 10,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    width: "100%",
    textAlign: "center",
  },
  lastKnownContainer: {
    backgroundColor: colors.warn,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  lastKnownText: {
    color: colors.onWarning,
    textAlign: "center",
  },
  coordsContainer: {
    padding: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  coordsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  coordsRowLabel: {
    fontSize: 18,
  },
  coordRowValue: {
    fontSize: 18,
    flexShrink: 1,
    textAlign: "right",
  },
  loader: {
    width: 28,
    height: 28,
  },
  bottomButtonsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  permissionButtonsContainer: {
    marginBottom: 20,
  },
  permissionText: {
    textAlign: "left",
    marginBottom: 15,
    color: colors.text,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
  },
}));
