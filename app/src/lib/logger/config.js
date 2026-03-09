// Default log levels
export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

// Get enabled scopes from environment
const getEnabledScopes = () => {
  const scopesStr = process.env.APP_LOG_SCOPES;
  if (!scopesStr) return null; // null means all scopes are enabled
  return scopesStr.split(",").map((scope) => scope.trim());
};

export const config = {
  // Enable all logs in development, use scope filtering in production
  enabledScopes: getEnabledScopes(),
  // Minimum log level, defaults to 'debug' in dev, 'info' in prod
  minLevel: __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
  // Include timestamp in logs
  includeTimestamp: true,
  // Include scope in logs
  includeScope: true,
};

// Log level priorities (higher number = higher priority)
export const LOG_LEVEL_PRIORITY = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARN]: 2,
  [LOG_LEVELS.ERROR]: 3,
};

// Function to update the minimum log level
export const setMinLogLevel = (level) => {
  if (LOG_LEVELS[level] || Object.values(LOG_LEVELS).includes(level)) {
    config.minLevel = level;
    return true;
  }
  return false;
};
