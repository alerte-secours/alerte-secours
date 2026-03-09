import { View, useWindowDimensions } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import DrawerContent from "~/navigation/DrawerNav/DrawerContent";
import { useDrawerState } from "~/navigation/Context";
import getDefaultDrawerWidth from "~/navigation/DrawerNav/getDefaultDrawerWidth";

import Main from "~/scenes/Main";
import Profile from "~/scenes/Profile";
import Notifications from "~/scenes/Notifications";
import Params from "~/scenes/Params";
import Links from "~/scenes/Links";
import NumberLinks from "~/scenes/NumberLinks";
import Relatives from "~/scenes/Relatives";
import Sheets from "~/scenes/Sheets";
import AlertAggListArchived from "~/scenes/AlertAggListArchived";
import About from "~/scenes/About";
import Contribute from "~/scenes/Contribute";
import Location from "~/scenes/Location";
import DAEList from "~/scenes/DAEList";
import DAEItem from "~/scenes/DAEItem";
import Developer from "~/scenes/Developer";
import HelpSignal from "~/scenes/HelpSignal";

import Text from "~/components/Text";
// import ColoredDotLevel from "~/components/ColoredDotLevel";

// import SendAlertConfirm from "~/scenes/SendAlertConfirm";
import NullComponent from "~/components/NullComponent";

import Expired from "~/scenes/Expired";
import NotFound from "~/scenes/NotFound";
import NotFoundOrExpired from "~/scenes/NotFoundOrExpired";

import {
  useAlertState,
  navActions,
  useParamsState,
  useNotificationsState,
} from "~/stores";

import { useTheme } from "~/theme";
import React from "react";

import SendAlertConfirm from "~/scenes/SendAlertConfirm";
import SendAlertFinder from "~/scenes/SendAlertFinder";

const Drawer = createDrawerNavigator();

export default React.memo(function DrawerNav() {
  // console.debug("Render Drawer", new Date());
  const [drawerState, setDrawerState] = useDrawerState();

  const { colors, custom } = useTheme();

  const iconProps = {
    size: 20,
    color: colors.primary,
  };

  const iconFocusedProps = {
    color: colors.onBackground,
  };

  const dimensions = useWindowDimensions();

  const navigation = useNavigation();

  const { maxAlertingLevel, alertingListLength } = useAlertState([
    "maxAlertingLevel",
    "alertingListLength",
  ]);
  const { newCount } = useNotificationsState(["newCount"]);
  const maxAlertingColor = maxAlertingLevel
    ? custom.appColors[maxAlertingLevel]
    : null;

  const { devModeEnabled } = useParamsState(["devModeEnabled"]);

  return (
    <Drawer.Navigator
      backBehavior="history"
      drawerContent={(props) => <DrawerContent {...props} />}
      drawerStyle={{
        width: getDefaultDrawerWidth(dimensions),
      }}
      screenOptions={{
        headerShown: false,
      }}
      screenListeners={{
        state: (e) => {
          navActions.updateRouteFromDrawer(e.data.state);
        },
      }}
    >
      {/* start Main section, names are related to ~/stores/nav */}
      <Drawer.Screen
        name="SendAlert"
        component={Main}
        options={{
          tabScreen: "SendAlertTab",
          tabScreenFocused: drawerState.topTabFocused === "SendAlert",
          drawerLabel: "Lancer une Alerte",
          drawerIcon: ({ focused }) => (
            <Entypo
              name="megaphone"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
        }}
        listeners={{
          focus: () =>
            setDrawerState({
              topTabFocused: "SendAlert",
              homeFocused: true,
            }),
          blur: () =>
            setDrawerState({
              topTabFocused: "",
              homeFocused: false,
              topTabPrev: "SendAlert",
            }),
        }}
      />
      <Drawer.Screen
        name="AlertAgg"
        component={Main}
        options={{
          tabScreen: "AlertAggTab",
          tabScreenFocused: drawerState.topTabFocused == "AlertAgg",
          drawerLabel: (props) => (
            <View style={{ flexDirection: "row" }}>
              <Text style={{ color: props.color }}>Alertes </Text>
              {maxAlertingLevel && (
                <Text
                  style={{
                    color: maxAlertingColor,
                    fontSize: 11,
                    fontWeight: "bold",
                  }}
                >
                  ({alertingListLength})
                </Text>
              )}
            </View>
          ),
          drawerIcon: ({ focused }) => (
            <>
              <View style={{ flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="message-bulleted"
                  {...iconProps}
                  {...(focused ? iconFocusedProps : {})}
                />
                {/* <ColoredDotLevel level={maxAlertingLevel} /> */}
              </View>
            </>
          ),
          unmountOnBlur: true,
        }}
        listeners={{
          beforeRemove: (e) => {
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
          blur: () =>
            setDrawerState({
              topTabFocused: "",
              homeFocused: false,
              topTabPrev: "AlertAgg",
            }),
        }}
      />
      <Drawer.Screen
        name="AlertCur"
        component={Main}
        options={{
          tabScreen: "AlertCurTab",
          tabScreenFocused: drawerState.topTabFocused == "AlertCur",
          drawerLabel: "Alerte en cours",
          drawerIcon: ({ focused }) => (
            <Entypo
              name="circular-graph"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
        }}
        listeners={{
          focus: () =>
            setDrawerState({
              topTabFocused: "AlertCur",
              homeFocused: true,
            }),
          blur: () =>
            setDrawerState({
              topTabFocused: "",
              homeFocused: false,
              topTabPrev: "AlertCur",
            }),
        }}
      />
      {/* end Main section */}

      <Drawer.Screen
        name="CallEmergency"
        // component={SendAlertConfirm}
        // initialParams={{
        //   level: "yellow",
        //   confirmed: true,
        //   forceCallEmergency: true,
        // }}
        component={NullComponent}
        options={{
          drawerLabel: "Appeler les Secours",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              // name={focused ? "phone-in-talk" : "phone"}
              name={focused ? "phone-in-talk" : "cellphone"}
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          onItemPress: () => {
            navigation.navigate("SendAlertConfirm", {
              level: "red",
              confirmed: true,
              forceCallEmergency: true,
            });
          },
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="AlertAggListArchived"
        component={AlertAggListArchived}
        options={{
          drawerLabel: "Alertes archivées",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="archive"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Profile"
        component={Profile}
        options={{
          drawerLabel: "Mon Profil",
          drawerIcon: ({ focused }) => (
            <MaterialIcons
              name="face"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Notifications"
        component={Notifications}
        options={{
          drawerLabel: (props) => (
            <View style={{ flexDirection: "row" }}>
              <Text style={{ color: props.color }}>Notifications </Text>
              {newCount > 0 && (
                <Text
                  style={{
                    color: colors.blueLight,
                    fontSize: 11,
                    fontWeight: "bold",
                  }}
                >
                  ({newCount})
                </Text>
              )}
            </View>
          ),
          drawerIcon: ({ focused }) => (
            <MaterialIcons
              name={
                newCount > 0 ? "notifications-active" : "notifications-none"
              }
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Relatives"
        component={Relatives}
        options={{
          drawerLabel: "Mes Proches",
          drawerIcon: ({ focused }) => (
            <MaterialIcons
              name="quick-contacts-dialer"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Params"
        component={Params}
        options={{
          drawerLabel: "Paramètres",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="cog"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Location"
        component={Location}
        options={{
          drawerLabel: "Ma Localisation",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="map-marker-outline"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="DAEList"
        component={DAEList}
        options={{
          drawerLabel: "Défibrillateurs",
          drawerIcon: ({ focused }) => (
            <FontAwesome6
              name="heart-circle-bolt"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
            // <MaterialCommunityIcons
            //   name="heart-flash"
            //   {...iconProps}
            //   {...(focused ? iconFocusedProps : {})}
            // />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Links"
        component={Links}
        options={{
          drawerLabel: "Liens utiles",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="web"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="NumberLinks"
        component={NumberLinks}
        options={{
          drawerLabel: "Numéros utiles",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="cellphone-information"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="HelpSignal"
        component={HelpSignal}
        options={{
          drawerLabel: "Signal d'appel à l'aide",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="hand-back-left"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Contribute"
        component={Contribute}
        options={{
          drawerLabel: "Faire un don",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="hand-heart"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Sheets"
        component={Sheets}
        options={{
          drawerLabel: "Fiches d'aides",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              // name="file-document-box-multiple"
              name="file-document"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="About"
        component={About}
        options={{
          drawerLabel: "À Propos",
          drawerIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="information"
              {...iconProps}
              {...(focused ? iconFocusedProps : {})}
            />
          ),
          unmountOnBlur: true,
        }}
        listeners={{}}
      />
      <Drawer.Screen
        name="Expired"
        component={Expired}
        options={{
          hidden: true,
          unmountOnBlur: true,
        }}
      />
      <Drawer.Screen
        name="NotFound"
        component={NotFound}
        options={{
          hidden: true,
          unmountOnBlur: true,
        }}
      />
      <Drawer.Screen
        name="NotFoundOrExpired"
        component={NotFoundOrExpired}
        options={{
          hidden: true,
          unmountOnBlur: true,
        }}
      />
      <Drawer.Screen
        name="SendAlertConfirm"
        options={{
          hidden: true,
          unmountOnBlur: true,
        }}
        component={SendAlertConfirm}
      />
      <Drawer.Screen
        name="SendAlertFinder"
        options={{
          hidden: true,
          unmountOnBlur: true,
        }}
        component={SendAlertFinder}
      />
      <Drawer.Screen
        name="DAEItem"
        component={DAEItem}
        options={{
          hidden: true,
          unmountOnBlur: true,
        }}
      />
      {devModeEnabled && (
        <Drawer.Screen
          name="Developer"
          component={Developer}
          options={{
            drawerLabel: "Hack me",
            drawerIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="dev-to"
                {...iconProps}
                {...(focused ? iconFocusedProps : {})}
              />
            ),
            unmountOnBlur: true,
          }}
          listeners={{}}
        />
      )}
    </Drawer.Navigator>
  );
});
