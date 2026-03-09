import React, { useMemo } from "react";
import { View, Image } from "react-native";
import { createStyles, useTheme } from "~/theme";
import Text from "~/components/Text";
import { useAlertState, useSessionState } from "~/stores";
import useTimeDisplay from "~/hooks/useTimeDisplay";

const avatarLogo = require("~/assets/img/logo192.png");

export default function MessageWelcome() {
  const styles = useStyles();
  const { colors, custom } = useTheme();

  const { navAlertCur } = useAlertState(["navAlertCur"]);
  const { alert } = navAlertCur;
  const { level } = alert;
  const levelColor = custom.appColors[level];

  const createdAtText = useTimeDisplay(alert.createdAt);

  const { userId } = alert;
  const { userId: sessionUserId } = useSessionState(["userId"]);
  const isSent = userId === sessionUserId;

  const noticeText = isSent
    ? "Suivez ici les retours des personnes alertées et répondez à leurs messages"
    : "Partagez ici vos observations et échangez directement avec la personne qui a envoyé l’alerte";

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
                Canal de discussion concernant l'alerte
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
            {/* <View style={styles.contentLine}>
              <Text style={styles.contentText}>Envoyée par :</Text>
              <Text style={styles.contentTextValue}>{alert.username}</Text>
            </View>
            <View style={styles.contentLine}>
              <Text style={styles.contentText}>Depuis l'adresse :</Text>
              <Text style={styles.contentTextValue}>{alert.address}</Text>
            </View>
            <View style={styles.contentLine}>
              <Text style={styles.contentText}>Localisation en 3 mots :</Text>
              <Text style={styles.contentTextValue}>{alert.what3Words}</Text>
            </View> */}
            <View style={[styles.contentLine, styles.contentLineBottom]}>
              <Text style={[styles.contentText, styles.contentTextBottom]}>
                {noticeText}
              </Text>
            </View>
          </View>
          <View style={styles.time}>
            <Text style={styles.timeText}>{createdAtText}</Text>
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
    color: colors.primary,
    fontSize: 15,
    paddingRight: 5,
    textAlign: "right",
    flexGrow: 1,
  },
  contentLineTop: {
    paddingBottom: 5,
  },
  contentTextTop: {
    textDecorationLine: "underline",
  },
  contentLineBottom: {
    paddingVertical: 5,
  },
  contentTextBottom: {
    fontStyle: "italic",
    fontSize: 16,
  },
  time: {
    alignSelf: "flex-end",
  },
  timeText: {
    paddingTop: 2,
    color: colors.grey,
    fontSize: 14,
  },
}));
