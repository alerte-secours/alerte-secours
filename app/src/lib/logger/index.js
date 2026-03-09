import { config, LOG_LEVELS, LOG_LEVEL_PRIORITY } from "./config";

class Logger {
  constructor() {
    this.scopes = new Set();
  }

  /**
   * Creates a new logger instance with specified scopes
   * @param {Object} scopes - Object containing scope labels
   * @returns {Logger} New logger instance with scopes
   */
  withScopes(scopes) {
    const logger = new Logger();
    logger.scopes = new Set([...this.scopes, ...Object.values(scopes)]);
    return logger;
  }

  /**
   * Checks if the current scopes are enabled based on configuration
   * @returns {boolean}
   */
  areScopesEnabled() {
    if (!config.enabledScopes) return true; // All scopes enabled
    return Array.from(this.scopes).some((scope) =>
      config.enabledScopes.includes(scope),
    );
  }

  /**
   * Formats the log message with additional context
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Array} Formatted log arguments
   */
  formatLog(level, args) {
    const logParts = [];

    if (config.includeTimestamp) {
      logParts.push(`[${new Date().toISOString()}]`);
    }

    logParts.push(`[${level.toUpperCase()}]`);

    if (config.includeScope && this.scopes.size > 0) {
      logParts.push(`[${Array.from(this.scopes).join(",")}]`);
    }

    return [...logParts, ...args];
  }

  /**
   * Checks if a log level should be processed
   * @param {string} level - Log level to check
   * @returns {boolean}
   */
  shouldLog(level) {
    return (
      this.areScopesEnabled() &&
      LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.minLevel]
    );
  }

  debug(...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatLog(LOG_LEVELS.DEBUG, args));
    }
  }

  info(...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(...this.formatLog(LOG_LEVELS.INFO, args));
    }
  }

  warn(...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.log(...this.formatLog(LOG_LEVELS.WARN, args));
    }
  }

  error(...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.log(...this.formatLog(LOG_LEVELS.ERROR, args));
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export a function to create scoped loggers
export const createLogger = (scopes) => logger.withScopes(scopes);

// Export types and config for external use
export { LOG_LEVELS, setMinLogLevel } from "./config";
