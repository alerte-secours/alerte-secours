import React from "react";
import { View, Image } from "react-native";
import { createStyles, useTheme } from "~/theme";
import { Avatar as PaperAvatar } from "react-native-paper";

import env from "~/env";

import bgColorBySeed from "~/lib/style/bg-color-by-seed";
export default function Avatar({ message }) {
  const { username = "", avatarImageFileUuid } = message;

  const styles = useStyles();
  let color;
  if (!avatarImageFileUuid) {
    color = bgColorBySeed(username);
  }

  return (
    <View style={styles.userAvatar}>
      {avatarImageFileUuid && (
        <Image
          source={{
            uri: `${env.MINIO_URL}/avatar/${avatarImageFileUuid}.png`,
          }}
          style={{ width: 24, height: 24, borderRadius: 24 }}
        />
      )}
      {!avatarImageFileUuid && (
        <PaperAvatar.Text
          style={styles.userAvatarText}
          size={24}
          label={username ? username.slice(0, 1).toUpperCase() : "0"}
          backgroundColor={color}
        />
      )}
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  userAvatar: {},
  userAvatarText: {},
}));
