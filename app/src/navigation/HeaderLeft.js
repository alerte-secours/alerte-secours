import React from "react";

import { Image } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/elements";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useDrawerState } from "~/navigation/Context";
import { createStyles } from "~/theme";

const logo = require("~/assets/img/alert96.png");
export default function HeaderLeft(props) {
  const styles = useStyles();

  const navigation = useNavigation();
  const [drawerState] = useDrawerState();
  const { canGoBack } = props;

  if (canGoBack || !drawerState.homeFocused) {
    const { iconStyle } = props;
    return (
      <HeaderBackButton
        {...props}
        testID="header-left-back"
        labelVisible={false}
        style={[styles.size, styles.backButton]}
        onPress={() => {
          if (canGoBack) {
            navigation.goBack();
          } else {
            // HeaderLeft is rendered by the RootStack which has a single
            // "Main" screen, so canGoBack is always false here.
            // Dispatch GO_BACK targeted at the Drawer navigator so it
            // uses its history-based back behaviour.
            const rootState = navigation.getState();
            const drawerNavState = rootState.routes[0]?.state;
            if (
              drawerNavState?.key &&
              drawerNavState.history?.filter((h) => h.type === "route")
                .length > 1
            ) {
              navigation.dispatch({
                ...CommonActions.goBack(),
                target: drawerNavState.key,
              });
            } else {
              navigation.navigate(drawerState.topTabPrev || "SendAlert");
            }
          }
        }}
        backImage={() => (
          <MaterialCommunityIcons
            name="arrow-left"
            size={styles.size.width}
            style={[styles.icon, iconStyle]}
          />
        )}
      />
    );
  }

  return <Image style={[styles.size, styles.logo]} source={logo} />;
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => {
  const size = Math.max(24, wp(3));
  return {
    size: {
      width: size,
      height: size,
    },
    logo: {
      marginHorizontal: Math.max(8, wp(2)),
      color: colors.onSurface,
    },
    backButton: {
      marginHorizontal: Math.max(8, wp(2)),
      color: colors.onSurface,
      zIndex: 1,
    },
    icon: {
      color: colors.onSurface,
      opacity: 1,
    },
  };
});
