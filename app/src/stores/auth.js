import { secureStore } from "~/storage/memorySecureStore";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import jwtDecode from "jwt-decode";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";
import { createAtom } from "~/lib/atomic-zustand";

import promiseObject from "~/lib/async/promiseObject";
import isExpired from "~/lib/time/isExpired";

import { registerUser, loginUserToken } from "~/auth/actions";

// DEV
// SecureStore.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);
// SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
// SecureStore.deleteItemAsync(STORAGE_KEYS.DEV_USER_TOKEN);
// SecureStore.deleteItemAsync(STORAGE_KEYS.DEV_AUTH_TOKEN);
// SecureStore.deleteItemAsync(STORAGE_KEYS.ANON_USER_TOKEN);
// SecureStore.deleteItemAsync(STORAGE_KEYS.ANON_AUTH_TOKEN);
// SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN).then((t) => authLogger.debug("User token", { token: t }));

const authLogger = createLogger({
  module: FEATURE_SCOPES.AUTH,
  feature: "store",
});

export default createAtom(({ get, merge, getActions }) => {
  const sessionActions = getActions("session");

  const navActions = getActions("nav");
  const treeActions = getActions("tree");

  let loadingPromise;
  let loadingResolve;
  const initLoadingPromise = () => {
    loadingPromise = new Promise((res) => {
      loadingResolve = res;
    });
  };
  const startLoading = () => {
    authLogger.debug("Starting auth loading state");
    merge({
      userToken: null,
      loading: true,
    });
    initLoadingPromise();
  };
  const endLoading = (data = {}) => {
    authLogger.debug("Ending auth loading state", {
      hasUserToken: !!data.userToken,
    });
    merge({
      ...data,
      loading: false,
      initialized: true,
      onReloadAuthToken: null,
    });
    loadingResolve();
    loadingPromise = null;
  };
  const isLoading = () => {
    const { loading } = get();
    return loading;
  };
  initLoadingPromise();

  const loadUserJWT = async (authToken) => {
    try {
      authLogger.info("Attempting to login with auth token");
      const { userToken } = await loginUserToken({ authToken });
      authLogger.info("Successfully obtained user token");
      await secureStore.setItemAsync(STORAGE_KEYS.USER_TOKEN, userToken);
      endLoading({
        userToken,
      });
      sessionActions.loadSessionFromJWT(userToken);
      return { userToken };
    } catch (error) {
      authLogger.error("Failed to load user JWT", { error });
      if (error?.graphQLErrors?.[0]?.extensions.statusCode === 410) {
        authLogger.warn(
          "Auth token expired, clearing tokens and reinitializing",
        );
        await Promise.all([
          secureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
          secureStore.deleteItemAsync(STORAGE_KEYS.USER_TOKEN),
        ]);
        return init();
      }
      throw error;
    }
  };

  const init = async () => {
    authLogger.debug("Initializing auth state");
    let { userToken, authToken } = await promiseObject({
      userToken: secureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN),
      authToken: secureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
    });
    // await delay(5);
    // authLogger.debug("Auth tokens", { userToken, authToken });

    if (userToken) {
      const jwtData = jwtDecode(userToken);
      // authLogger.debug("JWT data", { jwtData });
      const { exp } = jwtData;
      // authLogger.debug("Token expiration", { isExpired: isExpired(exp) });
      if (isExpired(exp)) {
        authLogger.info("User token expired, clearing token");
        userToken = null;
      } else {
        endLoading({
          userToken,
        });
        sessionActions.loadSessionFromJWT(jwtData);
        return;
      }
    }

    if (!authToken) {
      authLogger.info("No auth token found, registering new user");
      const res = await registerUser();
      authLogger.info("Successfully registered new user");
      authToken = res.authToken;
      await secureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, authToken);
    }

    if (!userToken && authToken) {
      authLogger.info("Auth token present but no user token, loading user JWT");
      loadUserJWT(authToken);
    }
  };

  const reload = async () => {
    authLogger.info("Reloading auth state");

    // Check if we're already reloading or in a loading state
    const { isReloading, lastReloadTime } = get();
    const now = Date.now();
    const timeSinceLastReload = now - lastReloadTime;
    const RELOAD_COOLDOWN = 2000; // 2 seconds cooldown

    if (isReloading) {
      authLogger.info("Auth reload already in progress, skipping");
      return true;
    }

    if (timeSinceLastReload < RELOAD_COOLDOWN) {
      authLogger.info("Auth reload requested too soon, skipping", {
        timeSinceLastReload,
        cooldown: RELOAD_COOLDOWN,
      });
      return true;
    }

    if (isLoading()) {
      authLogger.info("Auth is already loading, waiting for completion");
      await loadingPromise;
      return true;
    }

    // Set reloading state
    merge({ isReloading: true, lastReloadTime: now });

    try {
      startLoading();

      authLogger.debug("Deleting userToken for refresh");
      await secureStore.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);

      await init();
      return true;
    } catch (error) {
      authLogger.error("Auth reload failed", { error: error.message });
      throw error;
    } finally {
      // Clear reloading state even if there was an error
      merge({ isReloading: false });
    }
  };

  const onReload = async () => {
    authLogger.info("Handling auth reload");
    const { onReloadAuthToken: authToken } = get();

    if (authToken) {
      await secureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, authToken);
      await loadUserJWT(authToken);
    } else {
      await init();
    }

    navActions.setNextNavigation([
      {
        name: "Profile",
      },
    ]);
  };

  const triggerReload = () => {
    treeActions.triggerReload(onReload);
  };
  const confirmLoginRequest = async ({ authTokenJwt, isConnected }) => {
    authLogger.info("Confirming login request", { isConnected });
    const reloadId = Date.now();
    if (!isConnected) {
      // backup anon tokens
      const [anonAuthToken, anonUserToken] = await Promise.all([
        secureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
        secureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN),
      ]);
      await Promise.all([
        secureStore.setItemAsync(STORAGE_KEYS.ANON_AUTH_TOKEN, anonAuthToken),
        secureStore.setItemAsync(STORAGE_KEYS.ANON_USER_TOKEN, anonUserToken),
      ]);
    }
    merge({ onReloadAuthToken: authTokenJwt, reloadId });
    triggerReload();
  };

  const impersonate = async ({ authTokenJwt }) => {
    authLogger.info("Starting impersonation");
    const [anonAuthToken, anonUserToken] = await Promise.all([
      secureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
      secureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN),
    ]);
    await Promise.all([
      secureStore.setItemAsync(STORAGE_KEYS.DEV_AUTH_TOKEN, anonAuthToken),
      secureStore.setItemAsync(STORAGE_KEYS.DEV_USER_TOKEN, anonUserToken),
    ]);
    merge({ onReloadAuthToken: authTokenJwt });
    triggerReload();
  };

  const logout = async () => {
    authLogger.info("Initiating logout");
    const [devAuthToken, devUserToken, anonAuthToken, anonUserToken] =
      await Promise.all([
        secureStore.getItemAsync(STORAGE_KEYS.DEV_AUTH_TOKEN),
        secureStore.getItemAsync(STORAGE_KEYS.DEV_USER_TOKEN),
        secureStore.getItemAsync(STORAGE_KEYS.ANON_AUTH_TOKEN),
        secureStore.getItemAsync(STORAGE_KEYS.ANON_USER_TOKEN),
      ]);
    if (devAuthToken && devUserToken) {
      await Promise.all([
        secureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, devAuthToken),
        secureStore.setItemAsync(STORAGE_KEYS.USER_TOKEN, devUserToken),
        secureStore.deleteItemAsync(STORAGE_KEYS.DEV_AUTH_TOKEN),
        secureStore.deleteItemAsync(STORAGE_KEYS.DEV_USER_TOKEN),
      ]);
    } else if (anonAuthToken && anonUserToken) {
      await Promise.all([
        secureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, anonAuthToken),
        secureStore.setItemAsync(STORAGE_KEYS.USER_TOKEN, anonUserToken),
        secureStore.deleteItemAsync(STORAGE_KEYS.ANON_AUTH_TOKEN),
        secureStore.deleteItemAsync(STORAGE_KEYS.ANON_USER_TOKEN),
      ]);
    } else {
      await Promise.all([
        secureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
        secureStore.deleteItemAsync(STORAGE_KEYS.USER_TOKEN),
      ]);
      merge({
        userOffMode: true,
      });
      return;
    }

    triggerReload();
  };

  const userOnMode = () => {
    authLogger.info("Enabling user mode");
    merge({
      userOffMode: false,
    });
    triggerReload();
  };

  const setUserToken = async (userToken) => {
    authLogger.info("Setting user token", {
      hasToken: !!userToken,
    });

    try {
      // Update secure storage
      await secureStore.setItemAsync(STORAGE_KEYS.USER_TOKEN, userToken);

      // Update in-memory state
      merge({ userToken });

      // Update session from JWT
      if (userToken) {
        const jwtData = jwtDecode(userToken);
        sessionActions.loadSessionFromJWT(jwtData);
      }

      authLogger.debug("User token updated successfully");
    } catch (error) {
      authLogger.error("Failed to set user token", { error: error.message });
      throw error;
    }
  };

  return {
    default: {
      userToken: null,
      loading: true,
      initialized: false,
      onReload: false,
      onReloadAuthToken: null,
      reloadId: null,
      userOffMode: false,
      isReloading: false,
      lastReloadTime: 0,
    },
    actions: {
      init,
      reload,
      confirmLoginRequest,
      impersonate,
      logout,
      onReload,
      userOnMode,
      setUserToken,
    },
  };
});
