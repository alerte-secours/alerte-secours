import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Maplibre from "@maplibre/maplibre-react-native";
import { Ionicons } from "@expo/vector-icons";

import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";
import CustomButton from "~/components/CustomButton";
import MapView from "~/containers/Map/MapView";
import useLocation from "~/hooks/useLocation";
import {
  geoplatformeSearch,
  geoplatformeReverse,
} from "~/lib/geo/geoplateforme";

const DEBOUNCE_MS = 500;
const DEFAULT_ZOOM = 14;

export default function FallbackLocationPicker({
  initialCoordinates,
  initialLabel,
  onSave,
  onClear,
}) {
  const theme = useTheme();
  const styles = useStyles();
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const debounceRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const selectedCoordsRef = useRef(initialCoordinates || null);
  const reverseGeocodeIdRef = useRef(0);

  const { coords } = useLocation();

  // Keep refs in sync
  onSaveRef.current = onSave;

  // Selected coordinates [lon, lat]
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoordinates || null,
  );
  const [addressLabel, setAddressLabel] = useState(initialLabel || "");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const reverseGeocode = useCallback(async (lat, lon) => {
    const requestId = ++reverseGeocodeIdRef.current;
    try {
      const address = await geoplatformeReverse(lat, lon);
      if (requestId !== reverseGeocodeIdRef.current) return; // stale response
      if (address) {
        setAddressLabel(address);
        if (onSaveRef.current && selectedCoordsRef.current) {
          onSaveRef.current(selectedCoordsRef.current, address);
        }
      }
    } catch {
      // reverse geocode failed silently — user can still save by coordinates
    }
  }, []);

  const handleSearchTextChange = useCallback((text) => {
    setSearchText(text);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (text.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await geoplatformeSearch(text.trim());
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch {
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setSearchLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const moveCameraTo = useCallback((lon, lat) => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lon, lat],
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 500,
        animationMode: "flyTo",
      });
    }
  }, []);

  const selectLocation = useCallback(
    (lon, lat, label) => {
      const newCoords = [lon, lat];
      setSelectedCoords(newCoords);
      selectedCoordsRef.current = newCoords;
      if (label) {
        setAddressLabel(label);
      }
      // Always notify parent immediately so save button is enabled
      if (onSaveRef.current) {
        onSaveRef.current(newCoords, label || "");
      }
      if (!label) {
        // Reverse geocode will call onSave again with the resolved address
        reverseGeocode(lat, lon);
      }
      moveCameraTo(lon, lat);
      setShowResults(false);
      setSearchText("");
    },
    [reverseGeocode, moveCameraTo],
  );

  const handleSearchResultPress = useCallback(
    (result) => {
      selectLocation(result.longitude, result.latitude, result.displayName);
    },
    [selectLocation],
  );

  const handleMapPress = useCallback(
    (event) => {
      const { geometry } = event;
      if (geometry && geometry.coordinates) {
        const [lon, lat] = geometry.coordinates;
        selectLocation(lon, lat, null);
      }
    },
    [selectLocation],
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (coords.latitude && coords.longitude) {
      selectLocation(coords.longitude, coords.latitude, null);
    }
  }, [coords, selectLocation]);

  const handleClear = useCallback(() => {
    setSelectedCoords(null);
    setAddressLabel("");
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  const initialCameraCenter =
    selectedCoords ||
    (coords.latitude && coords.longitude
      ? [coords.longitude, coords.latitude]
      : [2.3522, 48.8566]); // Default: Paris

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Rechercher une adresse..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchText}
            onChangeText={handleSearchTextChange}
            returnKeyType="search"
            accessibilityLabel="Rechercher une adresse"
            accessibilityHint="Saisissez une adresse pour la rechercher sur la carte"
          />
          {searchLoading && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </View>

        {/* Search results */}
        {showResults && (
          <View
            style={[
              styles.resultsContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {searchResults.map((result, index) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={`${result.latitude}-${result.longitude}-${index}`}
                style={[
                  styles.resultItem,
                  index < searchResults.length - 1 && styles.resultItemBorder,
                ]}
                onPress={() => handleSearchResultPress(result)}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.resultIcon}
                />
                <Text
                  style={[styles.resultText, { color: theme.colors.onSurface }]}
                  numberOfLines={2}
                >
                  {result.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          mapRef={mapRef}
          onPress={handleMapPress}
          compassViewPosition={1}
        >
          <Maplibre.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: initialCameraCenter,
              zoomLevel: DEFAULT_ZOOM,
            }}
          />
          {selectedCoords && (
            <Maplibre.ShapeSource
              id="fallback_location_source"
              shape={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: selectedCoords,
                },
                properties: {},
              }}
            >
              <Maplibre.CircleLayer
                id="fallback_location_circle"
                style={{
                  circleRadius: 12,
                  circleColor: theme.colors.primary,
                  circleOpacity: 0.9,
                  circleStrokeWidth: 3,
                  circleStrokeColor: "#fff",
                }}
              />
            </Maplibre.ShapeSource>
          )}
        </MapView>
      </View>

      {/* Address label */}
      {addressLabel ? (
        <View style={styles.addressContainer}>
          <Ionicons
            name="location"
            size={18}
            color={theme.colors.primary}
            style={styles.addressIcon}
          />
          <Text
            style={[
              styles.addressText,
              { color: theme.colors.onSurfaceVariant },
            ]}
            numberOfLines={2}
          >
            {addressLabel}
          </Text>
        </View>
      ) : null}

      {/* Use current location button */}
      <CustomButton
        mode="outlined"
        onPress={handleUseCurrentLocation}
        disabled={!coords.latitude || !coords.longitude}
        style={styles.locationButton}
        icon="crosshairs-gps"
      >
        Utiliser ma position actuelle
      </CustomButton>

      {/* Clear button (only if a location is set and onClear is provided) */}
      {selectedCoords && onClear && (
        <CustomButton
          mode="outlined"
          onPress={handleClear}
          style={styles.clearButton}
        >
          Supprimer la position
        </CustomButton>
      )}
    </View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    width: "100%",
  },
  searchContainer: {
    marginBottom: 10,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 44,
  },
  resultsContainer: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  resultIcon: {
    marginRight: 10,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  locationButton: {
    marginTop: 5,
  },
  clearButton: {
    marginTop: 5,
  },
}));
