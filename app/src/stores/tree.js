import { createAtom } from "~/lib/atomic-zustand";

import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";

const treeLogger = createLogger({
  module: SYSTEM_SCOPES.APP,
  feature: "tree-reload",
});

const reloadCallbacks = [];

export default createAtom(({ merge, getActions }) => {
  const sessionActions = getActions("session");
  const networkActions = getActions("network");

  const alertActions = getActions("alert");
  const navActions = getActions("nav");
  const fcmActions = getActions("fcm");
  const paramsActions = getActions("params");
  const notificationsActions = getActions("notifications");

  const resetStores = () => {
    navActions.reset();
    paramsActions.reset();
    fcmActions.reset();
    alertActions.reset();
    notificationsActions.reset();
  };

  const triggerReload = (callback) => {
    if (callback) {
      reloadCallbacks.push(callback);
    }
    // Clear session/store state first to stop user-level queries/subscriptions
    // while we swap identity tokens.
    sessionActions.clear();
    resetStores();
    merge({
      triggerReload: true,
      // Keep the tree suspended until we've run reload callbacks.
      suspend: true,
    });
  };

  const onReload = async () => {
    merge({
      triggerReload: false,
    });

    // Run all reload callbacks sequentially and await them.
    // This ensures auth identity swap completes BEFORE the network layer is recreated.
    while (reloadCallbacks.length > 0) {
      let callback = reloadCallbacks.shift();
      if (callback) {
        try {
          await Promise.resolve(callback());
        } catch (error) {
          treeLogger.error("Reload callback threw", {
            error: error?.message,
          });
        }
      }
    }

    networkActions.triggerReload();

    // Allow tree to render again; NetworkProviders will show its loader until ready.
    merge({ suspend: false });
  };

  const suspendTree = () => {
    merge({ suspend: true });
  };

  const splashScreenHidden = () => {
    merge({ splashScreenHidden: true });
  };

  return {
    default: {
      triggerReload: false,
      suspend: false,
      splashScreenHidden: false,
    },
    actions: {
      triggerReload,
      suspendTree,
      onReload,
      splashScreenHidden,
    },
  };
});
