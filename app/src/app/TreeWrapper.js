import React, { useEffect } from "react";
import Loader from "~/components/Loader";
import UserOff from "~/containers/UserOff";
import {
  useTreeState,
  useAuthState,
  useSessionState,
  treeActions,
} from "~/stores";

export default function TreeWrapper({ children }) {
  const treeState = useTreeState(["triggerReload", "suspend"]);
  const authState = useAuthState(["initialized", "userOffMode"]);
  const sessionState = useSessionState(["initialized"]);
  useEffect(() => {
    if (treeState.triggerReload) {
      treeActions.onReload();
    }
  }, [treeState.triggerReload]);
  if (!(authState.initialized && sessionState.initialized)) {
    return <Loader />;
  }
  if (authState.userOffMode) {
    return <UserOff />;
  }
  if (treeState.suspend) {
    return <Loader />;
  }
  return <>{children}</>;
}
