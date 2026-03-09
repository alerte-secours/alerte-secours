import React, { useMemo } from "react";
import { View, Image } from "react-native";
import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";

const avatarLogo = require("~/assets/img/logo192.png");

export default function MessageWelcome() {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={[styles.bubbleContainer, styles.bubbleContainerLeft]}>
        <View style={styles.userAvatar}>
          <Image
            source={avatarLogo}
            style={{ width: 24, height: 24, borderRadius: 24 }}
          />
        </View>
        <View style={[styles.triangle, styles.triangleLeft]} />
        <View style={[styles.bubble, styles.bubbleOthers]}>
          <View style={styles.username}>
            <Text style={styles.usernameText}>Alerte-Secours</Text>
          </View>
          <View style={styles.content}>
            <View style={[styles.contentLine, styles.contentLineTop]}>
              <Text style={[styles.contentText, styles.contentTextTop]}>
                Vous êtes ici sur la vue aggrégée de l'ensemble des messages
                concernants toutes vos alertes en cours.
              </Text>
              <Text style={[styles.contentText, styles.contentTextTop]}>
                ℹ️ Pour vous rendre sur le canal de discussion associé à un
                message cliquez sur le nom de l'alerte en bas de celui-ci.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    flex: 1,
  },
  bubbleContainer: {
    flexDirection: "row",
    maxWidth: "100%",
    marginBottom: 5,
    paddingRight: 25,
  },
  bubbleContainerRight: {
    flexDirection: "row-reverse",
  },
  bubble: {
    flexShrink: 1,
    paddingHorizontal: 5,
    backgroundColor: colors.surface,
    // borderRadius: 15,
    borderRadius: 10,
    paddingVertical: 4,
  },
  bubbleOthers: {},
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderTopWidth: 10,
    borderBottomWidth: 10,
    marginTop: 2,
  },
  triangleLeft: {
    borderRightWidth: 20,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: colors.surface,
    marginRight: -10,
  },
  username: {
    flexDirection: "row",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "capitalize",
    color: colors.primary,
  },
  userAvatar: {
    paddingRight: 5,
  },
  content: {
    paddingHorizontal: 4,
  },
  contentLine: {
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  contentText: {
    color: colors.onSurface,
    fontSize: 15,
    paddingRight: 5,
    lineHeight: 22,
  },
  contentLineTop: {
    paddingBottom: 5,
  },
  contentTextTop: {
    marginBottom: 5,
  },
}));
