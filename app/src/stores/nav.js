import { createAtom } from "~/lib/atomic-zustand";
import { createLogger } from "~/lib/logger";
import { NAVIGATION_SCOPES } from "~/lib/logger/scopes";

const navLogger = createLogger({
  module: NAVIGATION_SCOPES.ROUTER,
  feature: "store",
});

/*
- NavigationContainer
  - RootStack
    -  Main
      - Drawer
      - Main
        drawer is calling Main from named,
          eg: Main->AlertCur->AlertCur, you have to double call to screen
        - 3 main views
        - ... (all from header header-right, top tabs, and left menu)
    -   SendAlertFinder
    -   SendAlertConfirm
    -   ... (all without 3 mains top tabs)
*/

export default createAtom(({ get, merge, reset }) => {
  // related to ~/navigation/Drawer props.name of <Drawer.Screen where component={Main}
  const mainRoutes = ["SendAlert", "AlertAgg", "AlertCur"];

  const updateRoute = (m) => {
    navLogger.debug("Updating route", { updates: m });
    const { rootRouteName, drawerRouteName, mainRouteName } = {
      ...get(),
      ...m,
    };

    let routeName;
    if (rootRouteName !== "Main") {
      routeName = rootRouteName;
      navLogger.debug("Using root route name", {
        rootRouteName,
        drawerRouteName,
        mainRouteName,
      });
    } else if (mainRoutes.includes(drawerRouteName)) {
      routeName = mainRouteName;
      navLogger.debug("Using main route name", {
        rootRouteName,
        drawerRouteName,
        mainRouteName,
      });
    } else {
      routeName = drawerRouteName;
      navLogger.debug("Using drawer route name", {
        rootRouteName,
        drawerRouteName,
        mainRouteName,
      });
    }

    merge({
      ...m,
      routeName,
    });
    navLogger.debug("Route updated", { routeName });
  };

  const initialValues = {
    rootRouteName: "Main",
    drawerRouteName: "SendAlert",
    mainRouteName: "SendAlert",
    routeName: "SendAlert",
    nextNavigation: null,
    isOnMessageView: false,
    currentMessageAlertId: null,
  };

  return {
    default: initialValues,
    actions: {
      reset: () => {
        navLogger.debug("Resetting navigation state to initial values");
        reset();
      },
      updateRouteFromRootStack: (state) => {
        navLogger.debug("Updating route from root stack", { state });
        const { index, routeNames } = state;
        const rootRouteName = routeNames[index];
        updateRoute({
          rootRouteName,
        });
      },
      updateRouteFromDrawer: (state) => {
        navLogger.debug("Updating route from drawer", { state });
        const { index, routeNames } = state;
        const drawerRouteName = routeNames[index];
        updateRoute({
          drawerRouteName,
        });
      },
      updateRouteFromMain: (state) => {
        navLogger.debug("Updating route from main", { state });
        const { index, routeNames } = state;
        const mainRouteName = routeNames[index];
        updateRoute({
          mainRouteName,
        });
      },
      setNextNavigation: (nextNavigation) => {
        navLogger.debug("Setting next navigation", { nextNavigation });
        merge({
          nextNavigation,
        });
      },
      setMessageViewFocus: (isFocused, alertId = null) => {
        navLogger.debug("Setting message view focus", { isFocused, alertId });
        merge({
          isOnMessageView: isFocused,
          currentMessageAlertId: isFocused ? alertId : null,
        });
      },
    },
  };
});
