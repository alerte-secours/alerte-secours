import React, { useCallback } from "react";
import { View, Image, Linking } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { createStyles } from "~/theme";
import Text from "~/components/Text";
import AppLink from "react-native-app-link";

export default function AppButton({ logo, label, description, url, app }) {
  const styles = useStyles();

  const openPress = useCallback(async () => {
    if (app) {
      const { appName, appStoreId, appStoreLocale, playStoreId } = app;
      try {
        AppLink.openInStore({
          appName,
          appStoreId,
          appStoreLocale: appStoreLocale || "fr",
          playStoreId,
        });
      } catch (_err) {
        if (url) {
          Linking.openURL(url);
        }
      }
    } else if (url) {
      Linking.openURL(url);
    }
  }, [app, url]);

  return (
    <View style={styles.container}>
      <TouchableRipple style={styles.button} onPress={openPress}>
        <View style={styles.buttonContent}>
          <Image style={styles.logo} source={logo} />
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{label}</Text>
          </View>
        </View>
      </TouchableRipple>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    marginHorizontal: 25,
    marginBottom: 25,
    width: "100%",
  },
  button: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    width: "100%",
    backgroundColor: colors.surface,
  },
  buttonContent: {
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    margin: 15,
  },
  labelContainer: {
    flexDirection: "row",
    flexGrow: 1,
    flex: 1,
    paddingRight: 15,
  },
  label: {
    color: colors.onBackground,
    paddingRight: 15,
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 18,
    marginTop: 5,
    marginHorizontal: 15,
  },
}));
