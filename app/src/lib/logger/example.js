import { createLogger } from "./index";

// Create a logger with specific scopes
const logger = createLogger({
  component: "ExampleComponent",
  feature: "authentication",
});

// Usage examples:
logger.debug("Initializing component", { props: { userId: 123 } });
logger.info("User authenticated successfully");
logger.warn("Rate limit approaching", { currentRate: 95 });
logger.error("Failed to fetch user data", new Error("Network error"));

// Create a logger with different scopes
const networkLogger = createLogger({
  service: "api",
  module: "network",
});

networkLogger.info("API request started", { endpoint: "/users" });

// Example output format:
// [2025-02-17T10:39:35.123Z] [DEBUG] [component,feature] Initializing component { props: { userId: 123 } }
// [2025-02-17T10:39:35.124Z] [INFO] [component,feature] User authenticated successfully
// [2025-02-17T10:39:35.125Z] [WARN] [component,feature] Rate limit approaching { currentRate: 95 }
// [2025-02-17T10:39:35.126Z] [ERROR] [component,feature] Failed to fetch user data Error: Network error
// [2025-02-17T10:39:35.127Z] [INFO] [service,module] API request started { endpoint: "/users" }

// To filter logs by scope in production, set APP_LOG_SCOPES environment variable:
// APP_LOG_SCOPES=component,service
// This will only show logs from scopes containing "component" or "service"

// To set minimum log level, use APP_LOG_MIN_LEVEL:
// APP_LOG_MIN_LEVEL=warn
// This will only show warn and error logs
