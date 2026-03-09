# System Patterns

## Architecture Overview
- React Native mobile application
- GraphQL with Hasura backend
  - Federation of remote schemas
  - Real-time subscriptions support
  - Custom business logic through remote schemas
- Firebase for FCM push notifications
- Component-based architecture

## Key Technical Patterns

### GraphQL Subscription Management
1. Subscription Lifecycle:
   - Unique subscriptionKey for each subscription instance
   - Unconditional cleanup in useEffect hooks
   - Proper cleanup on:
     * Component unmount
     * Variables change
     * Skip condition change
   - Detailed logging for debugging

2. Cache Management:
   - Isolated cache contexts:
     * Alert-specific: `alert:${alertId}`
     * Aggregate view: `aggregate-messages`
   - Cache cleanup on:
     * Component mount
     * Component unmount
     * Variables change
   - Strict message filtering by alertId

3. Message Handling:
   - Alert-specific filtering
   - Aggregate view with oneAlert field
   - Optimistic updates per cache context

### State Management
- Apollo Client for GraphQL state management
- Local stores for app state
- Loading states tied to specific actions (e.g., SMS type)

### Component Structure
1. Components (src/components/)
   - Reusable UI components
   - Presentational components
   - Theme-aware components (e.g., LittleLoader)
   
2. Containers (src/containers/)
   - Business logic components
   - Data-fetching components
   - Feature-specific implementations

3. Chat Components:
   - MessagesFetcher:
     * Data fetching and subscription setup
     * Cache context management
     * Message filtering
   - ChatMessages:
     * Message display and UI logic
     * Scroll position management
     * New message indicators
   - AggregateMessages:
     * Cross-alert message display
     * Alert context integration
     * Navigation handling

### Authentication Flow
1. SMS Authentication:
   - Registration SMS (type "R")
   - Connection SMS (type "C")
   - Loading states specific to SMS type
   - 3-minute timeout for loading states
   - Automatic clearing on login request

2. Account Management:
   - Modal-based interface
   - Support for both phone and email
   - Loading states based on action type
   - Login request handling

### Data Flow
- GraphQL queries and mutations
- Real-time subscriptions
- Event system
- Login request monitoring

### Navigation & Deep Linking
- Custom navigation implementation
- Parameter passing for state management
- Modal coordination
- Deep Linking Configuration:
  1. iOS URL Types:
     * Custom scheme (com.alertesecours.alertesecours://)
     * Expo scheme (exp+alerte-secours://)
     * HTTPS scheme for Universal Links
     * Each URL type has proper CFBundleURLName configuration
  
  2. Universal Links:
     * Associated Domains capability enabled
     * apple-app-site-association file configuration:
       - Proper app ID format (TeamID.BundleID)
       - Wildcard paths pattern
       - Hosted at /.well-known/apple-app-site-association
     
  3. Deep Link Handling:
     * Expo Linking module integration
     * Initial URL handling
     * Runtime URL event listening
     * Custom handleDeepLink implementation

### Error Handling
- Sentry integration for error tracking
- Custom error boundaries and components
- Timeout handling for loading states
- Graceful subscription error handling
- Clear error logging for debugging

### UI/UX Patterns
1. Loading States:
   - Action-specific loading indicators
   - Timeout mechanisms
   - Clear loading state triggers

2. Modal Management:
   - Contextual modal opening
   - State preservation
   - Loading state coordination

3. Theme Support:
   - Dark/light theme compatibility
   - Dynamic color filters for animations
   - Consistent styling across components

### Testing
- E2E testing with Detox
- Component-level testing
- Flow-specific testing scenarios

### Build & Deployment
- Fastlane integration
- Custom build scripts
- Environment-specific configurations

## Best Practices
1. Loading State Management:
   - Tie loading states to specific actions
   - Implement timeouts for all loading states
   - Clear loading states on relevant events
   - Keep loading states focused and contextual

2. Component Design:
   - Clear separation of concerns
   - Consistent prop patterns
   - Theme awareness
   - Proper hook usage
   - Form state management:
     * Use react-hook-form for form handling
     * Track form changes via formState.isDirty
     * Disable submit buttons when no changes
     * Consistent disabled state styling (50% opacity)

3. Navigation:
   - Clear parameter passing
   - State management through navigation
   - Modal coordination

4. Authentication:
   - Type-specific SMS handling
   - Clear loading feedback
   - Proper timeout handling
   - Login request monitoring

5. Subscription Management:
   - Always provide cleanup functions in useEffect, even for effects that don't seem to need cleanup
   - Use proper cache isolation between views
   - Implement strict message filtering
   - Add detailed logging for debugging
   - Handle optimistic updates carefully
   - Clean up subscriptions before setting up new ones
   - Track component lifecycle with refs instead of let variables
   - Ensure consistent hook behavior across all effects
   - Maintain proper cleanup order in effects

6. Hook Usage Rules:
   - All useEffect hooks must return cleanup functions consistently
   - Use refs for mutable state that persists across renders
   - Track mounted state through refs, not variables
   - Clean up all subscriptions and side effects on unmount
   - Keep hook dependencies accurate and complete
   - Handle async operations safely with mounted checks
   - Ensure proper cleanup order when multiple effects interact
