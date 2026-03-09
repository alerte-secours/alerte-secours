import React, { useEffect } from "react";
import * as Linking from "expo-linking";
import ErrorBoundary from "react-native-error-boundary";
import * as Sentry from "@sentry/react-native";
import { ErrorUtils } from "react-native";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";

import { authActions, permissionWizardActions, paramsActions } from "~/stores";
import { secureStore } from "~/storage/memorySecureStore";
import memoryAsyncStorage from "~/storage/memoryAsyncStorage";

import "~/lib/mapbox";
import "~/i18n";

import { useFcm } from "~/notifications";

import storeSubscriptions from "./storeSubscriptions";
import AppRoot from "./AppRoot";
import useNetworkListener from "./useNetworkListener";
import handleDeepLink, { handleInitialURL } from "./handleDeepLink";
import AppLifecycleListener from "~/containers/AppLifecycleListener";

import { useUpdates } from "~/updates";
import Error from "~/components/Error";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import useTrackLocation from "~/hooks/useTrackLocation";
import useWsWatchdog from "~/hooks/useWsWatchdog";
// import { initializeBackgroundFetch } from "~/services/backgroundFetch";
import useMount from "~/hooks/useMount";

const appLogger = createLogger({
  module: SYSTEM_SCOPES.APP,
  feature: "core",
});

const lifecycleLogger = createLogger({
  module: SYSTEM_SCOPES.LIFECYCLE,
  feature: "error-handling",
});

// Enhanced error handler with comprehensive error normalization and handling
const errorHandler = (error, stackTrace) => {
  try {
    // Normalize various error types
    const normalizedError = (() => {
      if (error instanceof Error) return error;
      if (typeof error === "string") return new Error(error);
      if (typeof error === "object" && error !== null) {
        return new Error(error.message || JSON.stringify(error));
      }
      return new Error(String(error || "Unknown error"));
    })();

    // Enhance error with additional context
    normalizedError.originalError = error;
    normalizedError.timestamp = new Date().toISOString();
    if (stackTrace) {
      normalizedError.nativeStackTrace = stackTrace;
    }

    // Log error with comprehensive details
    lifecycleLogger.error("Application error occurred", {
      error: normalizedError.message,
      type: error?.constructor?.name,
      hasStackTrace: !!stackTrace,
      timestamp: normalizedError.timestamp,
      originalErrorType: typeof error,
    });

    // Capture to Sentry with enhanced context
    Sentry.withScope((scope) => {
      scope.setExtra("nativeStackTrace", stackTrace);
      scope.setExtra("errorType", error?.constructor?.name);
      scope.setExtra("isNativeError", !(error instanceof Error));
      scope.setExtra("timestamp", normalizedError.timestamp);
      scope.setExtra("originalErrorType", typeof error);
      scope.setExtra("originalError", error);
      Sentry.captureException(normalizedError);
    });

    lifecycleLogger.debug("Error details captured and sent to Sentry", {
      errorType: error?.constructor?.name,
      hasStackTrace: !!stackTrace,
      timestamp: normalizedError.timestamp,
    });
  } catch (handlerError) {
    // Fallback error handling if the main error handler fails
    lifecycleLogger.error("Error handler failed", {
      originalError: error?.message,
      handlerError: handlerError?.message,
    });
    Sentry.captureException(handlerError);
  }
};

// Set up global error handlers for both development and production
const setupGlobalErrorHandlers = () => {
  try {
    lifecycleLogger.info("Setting up global error handlers");

    // Enhanced global error handler with fatal error detection
    const globalErrorHandler = (error, isFatal) => {
      try {
        lifecycleLogger.error("Global error occurred", {
          error: error?.message,
          isFatal,
          isDev: __DEV__,
        });

        // Add additional context for fatal errors
        if (isFatal) {
          Sentry.withScope((scope) => {
            scope.setLevel("fatal");
            scope.setExtra("isFatalError", true);
            Sentry.captureException(error);
          });
        }

        errorHandler(error, null);
      } catch (handlerError) {
        // Fallback if error handler fails
        console.error("Fatal: Error handler failed", handlerError);
        Sentry.captureException(handlerError);
      }
    };

    // Set up global error handler
    global.ErrorUtils.setGlobalHandler(globalErrorHandler);
    lifecycleLogger.debug("Global error handler configured");

    // Enhanced promise rejection handling
    const rejectionTrackingOptions = {
      onUnhandled: (id, error) => {
        try {
          lifecycleLogger.error("Unhandled promise rejection", {
            error: error?.message,
            id,
            isDev: __DEV__,
          });

          // Add rejection specific context
          Sentry.withScope((scope) => {
            scope.setExtra("rejectionId", id);
            scope.setTag("error_type", "unhandled_promise_rejection");
            Sentry.captureException(error);
          });

          errorHandler(error, null);
        } catch (handlerError) {
          console.error("Failed to handle promise rejection", handlerError);
          Sentry.captureException(handlerError);
        }
      },
      onHandled: (id) => {
        lifecycleLogger.debug("Previously unhandled promise now handled", {
          id,
        });
      },
    };

    require("promise/setimmediate/rejection-tracking").enable(
      rejectionTrackingOptions,
    );
    lifecycleLogger.debug("Promise rejection tracking enabled");
  } catch (error) {
    lifecycleLogger.error("Failed to setup global error handlers", {
      error: error?.message,
    });
    Sentry.captureException(error);
  }
};

// Initialize error handlers immediately
setupGlobalErrorHandlers();

// Initialize stores with error handling
const initializeStores = async () => {
  try {
    appLogger.info("Initializing core stores and subscriptions");

    // Initialize each store with error handling
    const initializeStore = async (name, initFn) => {
      try {
        await initFn();
        appLogger.debug(`${name} initialized successfully`);
      } catch (error) {
        lifecycleLogger.error(`Failed to initialize ${name}`, {
          error: error?.message,
          store: name,
        });
        errorHandler(error);
      }
    };

    // Initialize memory stores first (needed by auth/params stores)
    await initializeStore("memorySecureStore", secureStore.init);
    await initializeStore("memoryAsyncStorage", memoryAsyncStorage.init);

    // Then initialize other stores sequentially
    await initializeStore("authActions", authActions.init);
    await initializeStore("permissionWizard", permissionWizardActions.init);
    await initializeStore("paramsActions", paramsActions.init);
    await initializeStore("storeSubscriptions", storeSubscriptions.init);

    appLogger.info("Core initialization complete");
  } catch (error) {
    lifecycleLogger.error("Critical: Store initialization failed", {
      error: error?.message,
    });
    errorHandler(error);
  }
};

// Initialize stores immediately (after errorHandler is defined)
void initializeStores();

function AppContent() {
  // Avoid logging inside render (this component re-renders frequently due to store updates).
  useEffect(() => {
    appLogger.info("Initializing app features");
  }, []);

  useFcm();
  useUpdates();
  useNetworkListener();
  useTrackLocation();
  useWsWatchdog();

  // useMount(() => {
  //   const setupBackgroundFetch = async () => {
  //     try {
  //       appLogger.info("Setting up BackgroundFetch");
  //       await initializeBackgroundFetch();
  //       appLogger.debug("BackgroundFetch setup completed");
  //     } catch (error) {
  //       lifecycleLogger.error("BackgroundFetch setup failed", {
  //         error: error?.message,
  //       });
  //       errorHandler(error);
  //     }
  //   };

  //   setupBackgroundFetch();
  // });

  // Handle deep links after app is initialized with error handling
  useEffect(() => {
    let subscription;

    const setupDeepLinks = async () => {
      try {
        appLogger.info("Setting up deep link handlers");
        await handleInitialURL().catch((error) => {
          lifecycleLogger.error("Failed to handle initial URL", {
            error: error?.message,
          });
          errorHandler(error);
        });

        subscription = Linking.addEventListener("url", (event) => {
          try {
            handleDeepLink(event.url);
          } catch (error) {
            lifecycleLogger.error("Deep link handling failed", {
              url: event.url,
              error: error?.message,
            });
            errorHandler(error);
          }
        });
      } catch (error) {
        lifecycleLogger.error("Deep link setup failed", {
          error: error?.message,
        });
        errorHandler(error);
      }
    };

    setupDeepLinks();

    return () => {
      try {
        appLogger.debug("Cleaning up deep link handlers");
        if (subscription?.remove) {
          subscription.remove();
        }
      } catch (error) {
        lifecycleLogger.error("Failed to cleanup deep link handlers", {
          error: error?.message,
        });
      }
    };
  }, []);

  // Avoid logging inside render (see effect above).
  return (
    <>
      <AppLifecycleListener />
      <AppRoot />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary
        onError={errorHandler}
        FallbackComponent={Error}
        // Add a buffer time before allowing reset to prevent immediate re-crashes
        minTimeBetweenResets={1000}
      >
        <AppContent />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
