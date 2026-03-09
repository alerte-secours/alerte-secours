# Product Context

## Project Overview
Alerte Secours is a mobile application built with React Native that handles alerts and emergency-related functionality. The app supports both iOS and Android platforms.

## Core Features
1. Deep Linking:
   - Alert sharing via URLs
   - Direct navigation to specific alerts
   - Support for both:
     * Universal Links (https://app.alertesecours.fr/...)
     * Custom scheme (com.alertesecours.alertesecours://)
   - Seamless user experience from web to app

2. Authentication & Registration:
   - Phone number registration with SMS verification
   - Account connection with SMS verification
   - Email-based authentication option
   - Visual feedback for authentication processes
   - Timeout handling for better user experience

2. Alert Management:
   - Alert creation and handling
   - Real-time updates
   - Alert information display
   - Alert level management

3. Communication:
   - Chat/Messaging system:
     * Alert-specific chat rooms
     * Aggregated message view
     * Real-time message updates
     * Message history
     * User identification in chats
     * Message status indicators
     * Audio message support
   - SMS notifications
   - Push notifications (via Firebase FCM)

4. Location & Mapping:
   - Map integration
   - Location-based features

5. User Management:
   - Profile management
   - Phone number management
   - Privacy settings
   - Account settings

## User Flows

### Deep Link Navigation:
1. Alert Sharing:
   - User receives alert link (SMS, email, etc.)
   - Clicking link opens app directly
   - App validates alert access code
   - Navigation to specific alert view
   - Location coordinates preserved

2. Web to App Transition:
   - User visits web URL
   - Seamless transition to app if installed
   - Fallback to web if app not installed
   - Consistent experience across platforms

### Phone Number Registration:
1. User clicks "Enregistrer mon numéro de téléphone"
2. SMS disclaimer appears for confirmation
3. Upon acceptance:
   - Navigation to Profile scene
   - Loading indicator shows on registration button
   - SMS code is sent
   - Loading clears on success or timeout

### Account Connection:
1. User clicks "Se connecter"
2. SMS disclaimer appears for confirmation
3. Upon acceptance:
   - Navigation to Profile scene
   - Account management modal opens
   - Loading indicator shows in modal
   - SMS code is sent
   - Loading clears on success or timeout

### Chat System:
1. Alert-Specific Chat:
   - Users can view messages for a specific alert
   - Real-time message updates
   - Message status indicators
   - Audio message support
   - User identification

2. Aggregated Messages:
   - View messages from all alerts
   - Alert context with each message
   - Quick navigation to specific alerts
   - Distance information
   - Real-time updates

3. Message Interactions:
   - Text message sending
   - Audio message recording/playback
   - Message status tracking
   - User presence indication
   - Scroll position management
   - New message indicators

### Profile Management:
- Phone number addition/removal
- Privacy settings configuration
- Account connection/disconnection
- Profile information management

## Integration Points
- Firebase (used only for FCM push notifications)
- GraphQL (using Hasura server with federated remote schemas)
- Sentry for error tracking

## User Experience Considerations
1. Loading States:
   - Context-specific loading indicators
   - Clear visual feedback for actions
   - Reasonable timeouts (3 minutes)
   - Automatic clearing on success

2. Theme Support:
   - Dark and light theme compatibility
   - Consistent visual feedback
   - Accessible color schemes

3. Error Handling:
   - Clear error messages
   - Timeout handling
   - Network error management
   - Graceful fallbacks

4. Chat Experience:
   - Smooth message delivery
   - Clear message status
   - Easy navigation between views
   - Proper scroll management
   - Clear user identification
   - Efficient message loading

## Target Users
*To be documented*

## Business Objectives
*To be documented*

## Core User Workflows
*Additional workflows to be documented*
