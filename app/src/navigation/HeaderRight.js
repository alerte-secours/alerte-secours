import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, Menu, Divider } from "react-native-paper";
import { MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import {
  useNavigation,
  DrawerActions,
  CommonActions,
} from "@react-navigation/native";
import {
  useAlertState,
  useNavState,
  navActions,
  useNotificationsState,
  useAggregatedMessagesState,
} from "~/stores";

import ColoredDotLevel from "~/components/ColoredDotLevel";
import ColoredDot from "~/components/ColoredDot";
import { createStyles } from "~/theme";

const quickNavIconSize = 18;

export default function HeaderRight(props) {
  const navigation = useNavigation();
  const { routeName } = useNavState(["routeName"]);

  const { maxAlertingLevel, navAlertCur } = useAlertState([
    "maxAlertingLevel",
    "navAlertCur",
  ]);
  const { newCount } = useNotificationsState(["newCount"]);
  const { messagesList } = useAggregatedMessagesState(["messagesList"]);

  const hasUnreadMessagesForCurrentAlert =
    navAlertCur &&
    navAlertCur.alert &&
    messagesList.some(
      (msg) => !msg.isRead && msg.alertId === navAlertCur.alert.id,
    );

  const { iconStyle } = props;

  const drawerExists = !navigation.canGoBack();

  const [dotMenuVisible, setDotMenuVisible] = useState(false);
  const openDotMenu = () => setDotMenuVisible(true);
  const closeDotMenu = () => setDotMenuVisible(false);

  const styles = useStyles();

  const navigateTo = useCallback(
    (navOpts) =>
      navigation.dispatch({
        ...CommonActions.navigate(navOpts),
      }),
    [navigation],
  );

  const { nextNavigation } = useNavState(["nextNavigation"]);
  useEffect(() => {
    if (nextNavigation === null) {
      return;
    }
    navActions.setNextNavigation(null);
    // console.log({ nextNavigation });
    navigateTo(...nextNavigation);
  }, [navigateTo, navigation, nextNavigation]);

  return (
    <View style={[styles.container]}>
      <IconButton
        testID="header-right-send-alert"
        accessibilityLabel="Alerter"
        accessibilityHint="Ouvre l'écran pour envoyer une alerte."
        style={[
          styles.button,
          styles.quickNavButton,
          routeName === "SendAlertTab" ? styles.buttonSelected : null,
        ]}
        onPress={() => {
          navigateTo({
            name: "SendAlert",
            params: {
              screen: "SendAlertTab",
            },
          });
        }}
        icon={() => (
          <Entypo
            name="megaphone"
            size={quickNavIconSize}
            style={[
              styles.buttonIcon,
              styles.quickNavIcon,
              iconStyle,
              routeName === "SendAlert" ? styles.buttonIconSelected : null,
            ]}
          />
        )}
      />

      <IconButton
        testID="header-right-alerts"
        accessibilityLabel="Alertes"
        accessibilityHint="Ouvre la liste des alertes."
        style={[
          styles.button,
          styles.quickNavButton,
          routeName === "AlertAggTab" ? styles.buttonSelected : null,
        ]}
        onPress={() => {
          navigateTo({
            name: "AlertAgg",
            params: {
              screen: "AlertAggTab",
              params: {
                screen: "AlertAggList",
              },
            },
          });
        }}
        icon={() => (
          <>
            <MaterialCommunityIcons
              name="message-bulleted"
              size={quickNavIconSize}
              style={[
                styles.buttonIcon,
                styles.quickNavIcon,
                iconStyle,
                routeName === "AlertAgg" ? styles.buttonIconSelected : null,
              ]}
            />
            <ColoredDotLevel level={maxAlertingLevel} />
          </>
        )}
      />

      <IconButton
        testID="header-right-current-alert"
        accessibilityLabel="Alerte en cours"
        accessibilityHint="Ouvre l'alerte en cours."
        style={[
          styles.button,
          styles.quickNavButton,
          routeName === "AlertCurTab" ? styles.buttonSelected : null,
        ]}
        onPress={() => {
          navigateTo({
            name: "AlertCur",
            params: {
              screen: "AlertCurTab",
            },
          });
        }}
        icon={() => (
          <>
            <Entypo
              name="circular-graph"
              size={quickNavIconSize}
              style={[
                styles.buttonIcon,
                styles.quickNavIcon,
                iconStyle,
                routeName === "AlertCur" ? styles.buttonIconSelected : null,
              ]}
            />
            {hasUnreadMessagesForCurrentAlert && <ColoredDot />}
          </>
        )}
      />

      {drawerExists && (
        <IconButton
          testID="header-right-menu"
          accessibilityLabel="Menu"
          accessibilityHint="Ouvre ou ferme le menu."
          style={[styles.button, styles.menuButton]}
          size={24}
          icon={() => (
            <>
              <MaterialCommunityIcons
                size={24}
                name="menu"
                style={[styles.buttonIcon, styles.menuIcon, iconStyle]}
              />
              {newCount > 0 && <ColoredDot />}
            </>
          )}
          onPress={() => {
            navigation.dispatch(DrawerActions.toggleDrawer());
          }}
        />
      )}

      {!drawerExists && (
        <Menu
          visible={dotMenuVisible}
          onDismiss={closeDotMenu}
          anchor={(() => {
            return (
              <IconButton
                testID="header-right-overflow"
                accessibilityLabel="Plus"
                accessibilityHint="Ouvre les options supplémentaires."
                style={[styles.button, styles.menuButton]}
                size={24}
                icon={() => (
                  <MaterialCommunityIcons
                    size={24}
                    name="dots-vertical"
                    style={[styles.buttonIcon, styles.menuIcon, iconStyle]}
                  />
                )}
                onPress={() => {
                  openDotMenu();
                }}
              />
            );
          })()}
        >
          <Menu.Item
            title="Mon Profil"
            onPress={() => {
              navigateTo({ name: "Profile" });
            }}
          />
          <Menu.Item
            title="Mes Proches"
            onPress={() => {
              navigateTo({ name: "Relatives" });
            }}
          />
          <Menu.Item
            title="Paramètres"
            onPress={() => {
              navigateTo({ name: "Params" });
            }}
          />
          <Menu.Item
            title="Liens utiles"
            onPress={() => {
              navigateTo({ name: "Links" });
            }}
          />
          <Menu.Item
            title="Numéros utiles"
            onPress={() => {
              navigateTo({ name: "NumberLinks" });
            }}
          />
          <Menu.Item
            title="Signal d'appel à l'aide"
            onPress={() => {
              navigateTo({ name: "HelpSignal" });
            }}
          />
          <Menu.Item
            title="Fiches d'aide"
            onPress={() => {
              navigateTo({ name: "Sheets" });
            }}
          />
          <Divider />
          <Menu.Item
            title="Faire un don"
            onPress={() => {
              navigateTo({ name: "Contribute" });
            }}
          />
          <Menu.Item
            title="À Propos"
            onPress={() => {
              navigateTo({ name: "About" });
            }}
          />
        </Menu>
      )}
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "transparent",
    elevation: 0,
  },

  buttonSelected: {
    backgroundColor: "rgba(30,30,30,0.2)",
  },
  buttonIcon: {},
  buttonIconSelected: {},

  button: {
    marginHorizontal: 0,
    // borderRadius: 0,
  },

  quickNavButton: {
    // backgroundColor: 'red',
    padding: 0,
  },

  quickNavIcon: {},

  menuButton: {
    // marginLeft: 2,
  },

  menuIcon: {},
}));
