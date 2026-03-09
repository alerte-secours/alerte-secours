import React from "react";
import { View } from "react-native";

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNavigation, CommonActions } from "@react-navigation/native";

import AlertAgg from "~/scenes/AlertAgg";
import AlertCur from "~/scenes/AlertCur";
import SendAlert from "~/scenes/SendAlert";
import { fontFamily, createStyles, useTheme } from "~/theme";

import { useDrawerState } from "~/navigation/Context";

import Text from "~/components/Text";
// import ColoredDotLevel from "~/components/ColoredDotLevel";

import {
  useAlertState,
  navActions,
  useAggregatedMessagesState,
} from "~/stores";

import AlertCurTabBarIcon from "./AlertCurTabBarIcon";

const Tab = createMaterialTopTabNavigator();

export default React.memo(function Main() {
  // console.debug("Render Main", new Date());

  const [, setDrawerState] = useDrawerState();
  const navigation = useNavigation();

  const styles = useStyles();

  const { colors, custom } = useTheme();

  const { maxAlertingLevel, alertingListLength, navAlertCur } = useAlertState([
    "maxAlertingLevel",
    "alertingListLength",
    "navAlertCur",
  ]);

  const { messagesList } = useAggregatedMessagesState(["messagesList"]);

  const unreadMessagesForCurrentAlert =
    navAlertCur && navAlertCur.alert
      ? messagesList.filter(
          (msg) => !msg.isRead && msg.alertId === navAlertCur.alert.id,
        ).length
      : 0;

  const maxAlertingColor = maxAlertingLevel
    ? custom.appColors[maxAlertingLevel]
    : null;

  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowIcon: true,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarTab,
        tabBarStyle: styles.tabBar,
        animationEnabled: false, // see https://github.com/react-navigation/react-navigation/issues/11128#issuecomment-1489337772
      }}
      screenListeners={{
        state: (e) => {
          navActions.updateRouteFromMain(e.data.state);
        },
      }}
    >
      <Tab.Screen
        name="SendAlertTab"
        component={SendAlert}
        options={{
          title: ({ color }) => {
            return (
              <Text style={[styles.tabBarLabel, { color }]}>
                {t("À l'aide !")}
              </Text>
            );
          },
          tabBarIcon: ({ style, ...props }) => (
            <Entypo name="megaphone" style={[style, styles.icon]} {...props} />
          ),
        }}
        listeners={{
          focus: () =>
            setDrawerState({
              topTabFocused: "SendAlert",
              homeFocused: true,
            }),
        }}
      />
      <Tab.Screen
        name="AlertAggTab"
        component={AlertAgg}
        options={{
          title: ({ color }) => {
            return (
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.tabBarLabel, { color }]}>
                  {"Alertes "}
                </Text>
                {maxAlertingLevel && (
                  <Text
                    style={{
                      color: maxAlertingColor,
                      fontSize: 10,
                      fontWeight: "bold",
                      paddingRight: 2,
                    }}
                  >
                    ({alertingListLength > 99 ? "+99" : alertingListLength})
                  </Text>
                )}
              </View>
            );
          },
          tabBarIcon: ({ style, ...props }) => (
            <>
              <View style={{ flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="message-bulleted"
                  style={[style, styles.icon]}
                  {...props}
                />
                {/* <ColoredDotLevel level={maxAlertingLevel} /> */}
              </View>
            </>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default navigation
            e.preventDefault();

            setDrawerState({
              topTabFocused: "AlertAgg",
              homeFocused: true,
            });

            // Handle navigation manually
            navigation.dispatch(
              CommonActions.navigate({
                name: "AlertAgg",
                params: {
                  screen: "AlertAggTab",
                  params: {
                    screen: "AlertAggList",
                  },
                },
              }),
            );
          },
        }}
      />
      <Tab.Screen
        name="AlertCurTab"
        component={AlertCur}
        options={{
          title: ({ color }) => {
            return (
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.tabBarLabel, { color }]}>{"Focus "}</Text>
                {unreadMessagesForCurrentAlert > 0 && (
                  <Text
                    style={{
                      color: colors.blueLight,
                      fontSize: 10,
                      fontWeight: "bold",
                      paddingRight: 2,
                    }}
                  >
                    (
                    {unreadMessagesForCurrentAlert > 99
                      ? "+99"
                      : unreadMessagesForCurrentAlert}
                    )
                  </Text>
                )}
              </View>
            );
          },
          tabBarIcon: (props) => <AlertCurTabBarIcon {...props} />,
        }}
        listeners={{
          focus: () =>
            setDrawerState({
              topTabFocused: "AlertCur",
              homeFocused: true,
            }),
        }}
      />
    </Tab.Navigator>
  );
});

const useStyles = createStyles(({ fontSize }) => ({
  icon: {
    fontSize: fontSize(18),
  },
  tabBar: {},
  tabBarTab: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabBarLabel: {
    textTransform: "none",
    fontFamily,
    marginLeft: 5,
  },
  tabBarIcon: {
    width: fontSize(18),
    height: fontSize(18),
    justifyContent: "center",
    alignItems: "center",
  },
}));
