import React from "react";

import { useWindowDimensions, Platform, StatusBar } from "react-native";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import {
  createStackNavigator,
  // CardStyleInterpolators,
} from "@react-navigation/stack";

import { useDpStyle } from "~/lib/style/dp";
import Drawer from "~/navigation/Drawer";
import HeaderLeft from "~/navigation/HeaderLeft";
import HeaderRight from "~/navigation/HeaderRight";

import ConnectivityError from "~/components/ConnectivityError";

import { useTheme, fontSet } from "~/theme";

import { navActions } from "~/stores";

const Stack = createStackNavigator();

function getHeaderTitle(route) {
  const routeName = getFocusedRouteNameFromRoute(route);
  switch (routeName) {
    case "Profile":
      return "Mon Profil";
    case "Params":
      return "Paramètres";
    case "Links":
      return "Liens utiles";
    case "NumberLinks":
      return "Numéros utiles";
    case "HelpSignal":
      return "Signal d'appel à l'aide";
    case "Relatives":
      return "Mes Proches";
    case "AlertAggListArchived":
      return "Alertes archivées";
    case "About":
      return "À Propos";
    case "Contribute":
      return "Faire un don";
    case "Location":
      return "Ma Localisation";
    case "NotFound":
      return "Non trouvé";
    case "Expired":
      return "Expiré";
    case "NotFoundOrExpired":
      return "Non trouvé ou expiré";
    case "Developer":
      return "Developer";

    case "SendAlertConfirm":
      return "Confirmer l'Alerte";
    case "SendAlertFinder":
      return "Par mot-clé";

    case "DAEList":
      return "Défibrillateurs";
    case "DAEItem":
      return "Défibrillateur";

    case "ConnectivityError":
      return "Non connecté";

    case "Notifications":
      return "Notifications";

    case "Main":
    case "SendAlert":
    case "AlertCur":
    case "AlertCurMap":
    case "AlertCurMessage":
    default:
      return "Alerte Secours";
  }
}

export default React.memo(function RootStackNav() {
  const { width: windowWidth } = useWindowDimensions();

  const styles = useDpStyle(({ wp, hp }) => {
    return {
      header: {
        elevation: 0,
        shadowOpacity: 0,
      },
      headerLeftContainer: {
        position: "absolute",
        height: "100%",
        paddingBottom: Platform.select({
          ios: 5,
          android: 0,
        }),
        zIndex: 1,
      },
      headerTitleContainer: {
        left: Math.max(50, wp(8)),
        marginHorizontal: Math.max(4, wp(1)),
      },
      headerRightContainer: {
        marginBottom: Platform.select({
          ios: 5,
          android: 0,
        }),
        width: Math.max(200, wp(25)),
      },
      headerTitle: {
        marginBottom: Platform.select({
          ios: 5,
          android: 0,
        }),
        fontFamily: fontSet.regular,
        fontSize: 17,
        margin: 0,
        padding: 0,
        left: 0,
      },
    };
  });

  const { colors, custom } = useTheme();

  const buttonColorsStyle = Platform.select({
    ios: {
      color: colors.onPrimary,
    },
    android: {
      color: colors.onPrimary,
      textShadowOffset: { width: 3, height: 3 },
      shadowColor: colors.surfaceSecondary,
      textShadowRadius: 3,
      shadowOpacity: 0.7,
    },
  });

  const backgroundColor = colors.primary;
  const headerTitleContainerStyle = {
    width:
      windowWidth -
      (styles.headerRightContainer.width +
        (styles.headerTitleContainer.marginHorizontal || 0) * 2),
  };

  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerLeft: (props) => (
          <HeaderLeft {...props} iconStyle={buttonColorsStyle} />
        ),
        headerRight: (props) => (
          <HeaderRight {...props} iconStyle={buttonColorsStyle} />
        ),
        headerStyle: [styles.header, { backgroundColor }],
        headerLeftContainerStyle: [
          styles.headerLeftContainer,
          buttonColorsStyle,
        ],
        headerRightContainerStyle: [styles.headerRightContainer],
        headerTitleContainerStyle: [
          styles.headerTitleContainer,
          headerTitleContainerStyle,
          buttonColorsStyle,
        ],
        headerTitleStyle: [styles.headerTitle, buttonColorsStyle],
        headerTitleAlign: "left",
        animationEnabled: false,
        headerMode: "screen",
      })}
      screenListeners={{
        state: (e) => {
          navActions.updateRouteFromRootStack(e.data.state);
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={Drawer}
        options={({ route }) => ({
          headerTitle: getHeaderTitle(route),
        })}
      />
      <Stack.Screen
        name="ConnectivityError"
        component={ConnectivityError}
        options={({ route }) => ({
          headerTitle: getHeaderTitle(route),
        })}
      />
    </Stack.Navigator>
  );
});
