import React, { useCallback } from "react";
import { View, Image, Linking } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { createStyles } from "~/theme";
import Text from "~/components/Text";

export default function WebButton({
  logo,
  label,
  description,
  url,
  tel,
  style,
  buttonStyle,
  labelTextStyle,
  descriptionTextStyle,
}) {
  const styles = useStyles();

  const openPress = useCallback(async () => {
    if (tel) {
      const cleanTel = tel.replace(/\s+/g, "");
      const target = cleanTel.startsWith("tel:") ? cleanTel : `tel:${cleanTel}`;
      await Linking.openURL(target);
      return;
    }

    if (url) {
      await Linking.openURL(url);
    }
  }, [tel, url]);

  return (
    <View style={[styles.container, style]}>
      <TouchableRipple style={[styles.button, buttonStyle]} onPress={openPress}>
        <View style={styles.buttonContent}>
          {logo ? <Image style={styles.logo} source={logo} /> : null}
          <View style={styles.labelContainer}>
            <Text style={[styles.label, labelTextStyle]}>{label}</Text>
          </View>
        </View>
      </TouchableRipple>
      <Text style={[styles.description, descriptionTextStyle]}>
        {description}
      </Text>
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
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 18,
    marginTop: 5,
    marginHorizontal: 15,
  },
}));
