# Centralized Logging System

A flexible, scope-based logging system for React Native applications that provides consistent log formatting and environment-based filtering.

## Features

- Scope-based logging for better organization and filtering
- Environment-based configuration
- Consistent log formatting with timestamps
- Development vs Production configurations
- Multiple log levels (debug, info, warn, error)
- Easy integration with existing codebase

## Installation

The logger is already integrated into the project. No additional installation steps required.

## Usage

### Basic Usage

```javascript
import { createLogger } from "~/lib/logger";

// Create a logger with scopes
const logger = createLogger({
  component: "MyComponent",
  feature: "authentication",
});

// Use different log levels
logger.debug("Debug message", { additionalData: "value" });
logger.info("Info message");
logger.warn("Warning message", { threshold: 100 });
logger.error("Error message", new Error("Something went wrong"));
```

### Configuration

Configure the logging system through environment variables:

- `APP_LOG_SCOPES`: Comma-separated list of enabled scope names
  ```
  APP_LOG_SCOPES=api,auth,network
  ```
  If not set, all scopes are enabled

- `APP_LOG_MIN_LEVEL`: Minimum log level to display
  ```
  APP_LOG_MIN_LEVEL=warn  // Only show warn and error logs
  ```
  Defaults to:
  - Development: "debug"
  - Production: "info"

### Log Levels

- `debug`: Detailed information for debugging
- `info`: General information about application operation
- `warn`: Warning messages for potentially problematic situations
- `error`: Error messages for serious problems

### Output Format

```
[timestamp] [LEVEL] [scope1,scope2] message additional_data
```

Example:
```
[2025-02-17T10:39:35.123Z] [INFO] [api,network] Request completed { status: 200 }
```

## Best Practices

1. **Use Meaningful Scopes**
   ```javascript
   // Good
   const logger = createLogger({
     component: "UserProfile",
     feature: "authentication",
   });

   // Not as descriptive
   const logger = createLogger({
     scope: "general",
   });
   ```

2. **Include Relevant Context**
   ```javascript
   // Good
   logger.error("Failed to fetch user data", {
     userId,
     error: error.message,
     statusCode: error.status,
   });

   // Missing important context
   logger.error("Failed to fetch user data");
   ```

3. **Use Appropriate Log Levels**
   - `debug`: Development/debugging information
   - `info`: Normal application flow
   - `warn`: Potential issues that don't block operation
   - `error`: Serious problems requiring attention

4. **Group Related Logs**
   ```javascript
   // Group related operations under the same scopes
   const authLogger = createLogger({
     module: "auth",
     feature: "login",
   });

   authLogger.info("Login attempt", { username });
   authLogger.debug("Validating credentials");
   authLogger.info("Login successful");
   ```

## Examples

See `example.js` for more usage examples.

## Production Considerations

1. Use `APP_LOG_SCOPES` to filter logs in production:
   ```
   APP_LOG_SCOPES=api,auth  // Only show logs from api and auth scopes
   ```

2. Set appropriate minimum log level:
   ```
   APP_LOG_MIN_LEVEL=warn  // Only show warnings and errors
   ```

3. Consider log volume and performance:
   - Avoid excessive debug logs in production
   - Include only necessary context in log messages
   - Use appropriate log levels to manage output

## Contributing

When adding new features or components:

1. Create a logger with descriptive scopes
2. Use consistent log levels
3. Include relevant context in log messages
4. Document any new logging patterns
