import React, { useCallback } from "react";
import { View } from "react-native";
import { IconButton, TouchableRipple } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Maplibre from "@maplibre/maplibre-react-native";
import Text from "~/components/Text";
import useTimeDisplay from "~/hooks/useTimeDisplay";
import { useNavigation } from "@react-navigation/native";
import { createStyles, useTheme } from "~/theme";
import { alertActions } from "~/stores";

export default function SelectedFeatureBubbleAlertInitial({ feature, close }) {
  const { properties = {} } = feature;
  const { alert } = properties;
  const styles = useStyles();
  const { colors, custom } = useTheme();
  const createdAtText = useTimeDisplay(alert.createdAt);
  const navigation = useNavigation();
  const goToAlert = useCallback(() => {
    alertActions.setNavAlertCur({ alert });
    navigation.navigate({
      name: "AlertCur",
      params: {
        screen: "AlertCurTab",
        params: {
          screen: "AlertCurOverview",
        },
      },
    });
  }, [alert, navigation]);

  const { level } = alert;
  const levelColor = custom.appColors[level];

  return (
    <Maplibre.MarkerView
      key={feature.properties.id}
      id="selectedFeaturePointAnnotation"
      aboveLayerID="lineLayer"
      coordinate={feature.geometry.coordinates}
      anchor={{ x: 0, y: 1 }}
    >
      <View style={styles.bubbleContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "flex-end",
          }}
        >
          <IconButton
            size={14}
            style={styles.closeButton}
            icon={() => (
              <MaterialCommunityIcons
                name="close"
                size={22}
                style={styles.closeButtonIcon}
              />
            )}
            onPress={() => close()}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
              Localisation initiale de l'Alerte
            </Text>
          </View>
          <View style={styles.contentLine}>
            <Text style={styles.contentText}>Sujet :</Text>
            <Text style={[styles.contentTextValue, { color: levelColor }]}>
              {alert.subject || "non indiqué"}
            </Text>
          </View>
          <View style={styles.contentLine}>
            <Text style={[styles.contentText]}>Code :</Text>
            <Text style={[styles.contentTextValue]}>#{alert.code}</Text>
          </View>
          <View style={styles.contentLine}>
            <Text style={styles.contentText}>Envoyée par :</Text>
            <Text style={styles.contentTextValue}>{alert.username}</Text>
            <Text style={styles.contentTextValue}>{createdAtText}</Text>
          </View>
          <View style={styles.contentLine}>
            <Text style={styles.contentText}>Depuis l'adresse :</Text>
            <Text style={styles.contentTextValue}>{alert.address}</Text>
          </View>
          <View style={styles.contentLine}>
            <Text style={styles.contentText}>À proximité de :</Text>
            <Text style={styles.contentTextValue}>{alert.nearestPlace}</Text>
          </View>
          <View style={styles.contentLine}>
            <Text style={styles.contentText}>Localisation en 3 mots :</Text>
            <Text style={styles.contentTextValue}>{alert.what3Words}</Text>
          </View>
          <TouchableRipple style={styles.alertLinkButton} onPress={goToAlert}>
            <View style={styles.alertLinkContent}>
              <MaterialCommunityIcons
                name="adjust"
                style={styles.alertLinkButtonIcon}
              />
              <Text style={styles.alertLinkText}>Situation</Text>
            </View>
          </TouchableRipple>
        </View>
      </View>
    </Maplibre.MarkerView>
  );
}

const useStyles = createStyles(({ wp, fontSize, theme: { colors } }) => ({
  bubbleContainer: {
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
    width: wp(75),
  },
  bubbleText: {
    color: colors.onSurface,
    fontSize: 16,
  },
  closeButton: {},
  closeButtonIcon: {
    color: colors.grey,
  },
  content: {
    paddingHorizontal: 4,
  },
  titleContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey,
    paddingBottom: 4,
  },
  titleText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  contentLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  contentText: {
    color: colors.onSurface,
    fontSize: 15,
    paddingRight: 5,
  },
  contentTextValue: {
    color: colors.onSurfaceVariant,
    fontSize: 15,
    paddingRight: 5,
    textAlign: "right",
    flexGrow: 1,
  },
  alertLinkButton: {
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 0,
    paddingVertical: 0,
    backgroundColor: colors.primary,
  },
  alertLinkContent: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  alertLinkText: {
    color: colors.surface,
    fontSize: 15,
  },
  alertLinkButtonIcon: {
    color: colors.surface,
    marginRight: 5,
    fontSize: 15,
  },
}));
