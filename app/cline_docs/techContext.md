# Technical Context

## Technology Stack
- React Native
- GraphQL with Hasura
  - Apollo Client for frontend
  - Federated remote schemas
- Firebase (FCM only for push notifications)
- Sentry for error tracking

## Development Environment
- Node.js (specified in .node-version)
- Yarn package manager (evidenced by .yarnrc.yml)
- ESLint for code linting (.eslintrc.js)
- TypeScript configuration (tsconfig.json)

## Backend Architecture
- Hasura GraphQL server
  - Federation of remote schemas
  - Real-time subscriptions support
  - Custom business logic through remote schemas

## Frontend Architecture
- React Native mobile app
- Apollo Client for GraphQL state management
- Real-time updates via GraphQL subscriptions
- Push notifications via Firebase Cloud Messaging

### Authentication System
1. SMS Authentication:
   - Two distinct SMS types: "R" (Registration) and "C" (Connect)
   - Type-specific loading states
   - 3-minute timeout mechanism
   - Login request monitoring via GraphQL subscription

2. Account Management:
   - Modal-based interface
   - Support for both SMS and email authentication
   - Loading state coordination based on action type
   - Login request handling through GraphQL mutations

### Loading State Management
1. Component-Level Loading:
   - Button built-in loading prop
   - LittleLoader component with theme support
   - Loading state timeouts
   - Login request-based clearing

2. Theme Integration:
   - Dark/light theme support
   - Dynamic color filters for Lottie animations
   - Theme-aware component styling

### Navigation & Deep Linking System
- Parameter-based state management
- Modal coordination
- Action-specific navigation flows
- Deep Linking Integration:
  1. Required Configurations:
     - iOS Universal Links setup
     - Associated Domains capability
     - apple-app-site-association file
     - URL scheme configurations in Info.plist
     - Custom Expo plugin to preserve URL schemes during prebuild
  
  2. Technical Requirements:
     - HTTPS server for apple-app-site-association file
     - Proper MIME type (application/json)
     - No redirects for /.well-known/apple-app-site-association
     - Valid app ID format (TeamID.BundleID)
     - CFBundleURLName format (following Expo's convention):
       * Production scheme: com.alertesecours.alertesecours (matches bundle ID)
       * Development scheme: com.alertesecours.alertesecours.expo (bundle ID + .expo)
       * Format defined in Expo's source code for consistency
  
  3. Implementation Components:
     - Expo Linking module integration
     - Initial URL handling
     - URL event listeners
     - Custom deep link parsing logic
     - withCustomScheme plugin for URL scheme preservation

## Build & Deployment Tools
- Fastlane for deployment
- Custom build scripts
- Environment configurations (.env.default, .env.staging, .env.prod)

## Platform-Specific
### iOS
- Xcode project configuration
- CocoaPods for dependency management
- Custom entitlements and capabilities
- FCM push notification setup

### Android
- Gradle build system
- Custom Gradle plugins
- FCM integration for push notifications

## Development Setup Requirements
*To be completed with setup instructions*

## Technical Constraints
- Loading states must be tied to specific actions
- Loading timeouts required for all async operations
- Theme compatibility required for all UI components
- Proper hook usage and dependency management

## Pending Implementations
- Multilingual support (i18n infrastructure exists but not implemented)

## Recent Technical Improvements
1. Loading State Management:
   - Action-specific loading indicators
   - Automatic timeout mechanism
   - Login request-based clearing
   - Theme-aware loading animations

2. Component Architecture:
   - Proper hook dependency management
   - Consistent prop patterns
   - Clear separation of concerns
   - Theme integration

3. Navigation Flow:
   - Type-specific parameter passing
   - Modal state coordination
   - Loading state synchronization

*Note: This document needs to be updated with:
- Complete dependency list
- Development setup instructions
- Known technical limitations
- Performance constraints
