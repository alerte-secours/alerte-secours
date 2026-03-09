import { Platform } from "react-native";
import BackgroundFetch from "react-native-background-fetch";
import { createLogger } from "~/lib/logger";
import { executeHeartbeatSync } from "~/location/backgroundTask";

const backgroundFetchLogger = createLogger({
  service: "background-fetch",
  task: "service",
});

/**
 * Initialize BackgroundFetch according to the documentation best practices.
 * This should be called once when the root component mounts.
 */
export const initializeBackgroundFetch = async () => {
  try {
    backgroundFetchLogger.info("Initializing BackgroundFetch service");

    // Configure BackgroundFetch for both platforms
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // Only valid option - gives best chance of execution
      },
      // Event callback - handles both default fetch events and custom scheduled tasks
      async (taskId) => {
        backgroundFetchLogger.info("BackgroundFetch event received", {
          taskId,
        });

        let syncResult = null;

        try {
          // Execute the shared heartbeat logic and get result
          syncResult = await executeHeartbeatSync();
          backgroundFetchLogger.debug("Heartbeat sync completed", {
            syncResult,
          });
        } catch (error) {
          backgroundFetchLogger.error("Heartbeat sync failed", {
            error: error.message,
            taskId,
          });
        } finally {
          // CRITICAL: Always call finish with appropriate result
          try {
            if (taskId) {
              let fetchResult;

              if (syncResult?.error || !syncResult?.syncSuccessful) {
                // Task failed
                fetchResult = BackgroundFetch.FETCH_RESULT_FAILED;
              } else if (
                syncResult?.syncPerformed &&
                syncResult?.syncSuccessful
              ) {
                // Force sync was performed successfully - new data
                fetchResult = BackgroundFetch.FETCH_RESULT_NEW_DATA;
              } else {
                // No sync was needed - no new data
                fetchResult = BackgroundFetch.FETCH_RESULT_NO_DATA;
              }

              BackgroundFetch.finish(taskId, fetchResult);
              backgroundFetchLogger.debug("BackgroundFetch task finished", {
                taskId,
                fetchResult,
              });
            }
          } catch (finishError) {
            backgroundFetchLogger.error(
              "Failed to finish BackgroundFetch task",
              {
                error: finishError.message,
                taskId,
              },
            );
          }
        }
      },
      // Timeout callback (REQUIRED by BackgroundFetch API)
      async (taskId) => {
        backgroundFetchLogger.warn("BackgroundFetch task timeout", { taskId });
        // CRITICAL: Must call finish on timeout with FAILED result
        try {
          BackgroundFetch.finish(taskId, BackgroundFetch.FETCH_RESULT_FAILED);
        } catch (error) {
          backgroundFetchLogger.error("Failed to finish timed out task", {
            error: error.message,
            taskId,
          });
        }
      },
    );

    backgroundFetchLogger.info("BackgroundFetch configured successfully", {
      status,
      platform: Platform.OS,
    });

    return status;
  } catch (error) {
    backgroundFetchLogger.error("Failed to initialize BackgroundFetch", {
      error: error.message,
      stack: error.stack,
      platform: Platform.OS,
    });
    throw error;
  }
};
