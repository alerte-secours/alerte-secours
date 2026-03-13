import { createStore } from "~/lib/atomic-zustand";

import tree from "./tree";
import auth from "./auth";
import permissions from "./permissions";
import session from "./session";
import location from "./location";
import alert from "./alert";
import nav from "./nav";
import network from "./network";
import fcm from "./fcm";
import params from "./params";
import notifications from "./notifications";
import permissionWizard from "./permissionWizard";
import aggregatedMessages from "./aggregatedMessages";
import defibs from "./defibs";
import usefulPlaces from "./usefulPlaces";

const store = createStore({
  tree,
  auth,
  permissions,
  session,
  location,
  alert,
  nav,
  network,
  fcm,
  params,
  permissionWizard,
  notifications,
  aggregatedMessages,
  defibs,
  usefulPlaces,
});

// console.log("store", JSON.stringify(Object.keys(store), null, 2));

export const {
  useStore,
  getState,

  useTreeState,
  getTreeState,
  subscribeTreeState,
  treeActions,

  useAuthState,
  getAuthState,
  subscribeAuthState,
  authActions,

  usePermissionsState,
  getPermissionsState,
  subscribePermissionsState,
  permissionsActions,

  useSessionState,
  getSessionState,
  subscribeSessionState,
  sessionActions,

  useLocationState,
  getLocationState,
  subscribeLocationState,
  locationActions,

  useAlertState,
  getAlertState,
  subscribeAlertState,
  alertActions,

  useNavState,
  getNavState,
  subscribeNavState,
  navActions,

  useNetworkState,
  getNetworkState,
  subscribeNetworkState,
  networkActions,

  useFcmState,
  getFcmState,
  subscribeFcmState,
  fcmActions,

  useParamsState,
  getDParamsState,
  subscribeParamsState,
  paramsActions,

  useNotificationsState,
  getNotificationsState,
  subscribeNotificationsState,
  notificationsActions,

  usePermissionWizardState,
  getPermissionWizardState,
  subscribePermissionWizardState,
  permissionWizardActions,

  useAggregatedMessagesState,
  getAggregatedMessagesState,
  subscribeAggregatedMessagesState,
  aggregatedMessagesActions,

  useDefibsState,
  getDefibsState,
  subscribeDefibsState,
  defibsActions,

  useUsefulPlacesState,
  getUsefulPlacesState,
  subscribeUsefulPlacesState,
  usefulPlacesActions,
} = store;
