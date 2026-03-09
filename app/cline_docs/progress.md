# Progress Tracking

## Recently Completed Features

### DAE v1 (Tasks 1–9) — 2026-03-06
1. Embedded DAE DB + safe open path:
   - ✅ Embedded DB asset: `src/assets/db/geodae.db`
   - ✅ Safe open path + repository: `src/db/openDb.js`, `src/db/defibsRepo.js`

2. Utilities + tests:
   - ✅ Corridor/geo utils: `src/utils/geo/corridor.js`
   - ✅ DAE helpers: `src/utils/dae/getDefibAvailability.js`, `src/utils/dae/subjectSuggestsDefib.js`
   - ✅ Jest config: `jest.config.js`

3. Store:
   - ✅ Defibrillators store: `src/stores/defibs.js`

4. Screens + navigation:
   - ✅ DAE list + item screens: `src/scenes/DAEList/index.js`, `src/scenes/DAEItem/index.js`
   - ✅ Navigation wiring: `src/navigation/Drawer.js`, `src/navigation/RootStack.js`

5. Alert integration:
   - ✅ Alert overview + map hooks: `src/scenes/AlertCurOverview/index.js`, `src/scenes/AlertCurMap/useFeatures.js`, `src/scenes/AlertCurMap/useOnPress.js`

6. Persistent suggestion modal:
   - ✅ `src/containers/DaeSuggestModal/index.js` mounted in `src/layout/LayoutProviders.js`

7. New asset:
   - ✅ Marker icon: `src/assets/img/marker-grey.png`

8. Verification:
   - ✅ `yarn lint` and `yarn test` passing

9. Runtime hardening follow-up fixes — 2026-03-07:
   - ✅ Hermes fix for H3 import:
     - `src/lib/h3/index.js`
     - `src/db/defibsRepo.js`
   - ✅ SQLite backend selection + wrappers (incl. op-sqlite adapter):
     - `src/db/openDb.js`
     - `src/db/openDbOpSqlite.js`
     - `src/db/openDbExpoSqlite.js`
   - ✅ Embedded DB staging + schema validation:
     - `src/db/ensureEmbeddedDb.js`
     - `src/db/validateDbSchema.js`
   - ✅ Android duplicate native libs packaging fix for op-sqlite:
     - `android/app/build.gradle`
   - ✅ Added dependency: `expo-file-system` (`package.json`)
   - ✅ Tests added:
     - `src/db/openDbOpSqlite.test.js`
     - `src/db/ensureEmbeddedDb.test.js`
     - `src/db/validateDbSchema.test.js`
   - ✅ Status: confirmed on Android emulator dev client that DAE list loads (no `no such table: defibs`).

### Push Notification Improvements
1. Background Notification Fixes:
   - ✅ Added required Android permissions
   - ✅ Enhanced notification channel configuration
   - ✅ Consolidated background message handling
   - ✅ Improved iOS critical notification settings
   - ✅ Fixed sound playing in all states

2. Implementation Details:
   - ✅ High importance notification channel
   - ✅ Proper background event handling
   - ✅ Critical notifications for iOS
   - ✅ Sound configuration for all states

### Deep Linking Fix
1. iOS Configuration:
   - ✅ Updated Info.plist URL schemes
   - ✅ Added proper CFBundleURLName entries
   - ✅ Configured Universal Links support
   - ✅ Updated apple-app-site-association file
   - ✅ Created withCustomScheme plugin to preserve URL schemes during prebuild

2. Implementation:
   - ✅ Proper URL scheme handling
   - ✅ Universal Links support
   - ✅ Expo Linking integration
   - ✅ Deep link parsing logic
   - ✅ URL scheme preservation during prebuild

### Chat System Improvements
1. Message Isolation Fix:
   - ✅ Fixed chat message mixing between views
   - ✅ Proper subscription cleanup implementation
   - ✅ Cache isolation between views
   - ✅ Improved error handling
   - ✅ Added detailed logging

2. Component Refactoring:
   - ✅ Shared utils extraction
   - ✅ Better state management
   - ✅ Improved subscription lifecycle

### Authentication & Registration
1. Phone Number Registration:
   - ✅ Registration button in Relatives scene
   - ✅ SMS disclaimer modal
   - ✅ Navigation to Profile with waitingSmsType="R"
   - ✅ Loading indicator on registration button
   - ✅ 3-minute timeout
   - ✅ Loading clears on login request

2. Account Connection:
   - ✅ Login button in Relatives scene
   - ✅ SMS disclaimer modal
   - ✅ Navigation to Profile with waitingSmsType="C"
   - ✅ Account management modal auto-opening
   - ✅ Loading indicator in modal
   - ✅ 3-minute timeout
   - ✅ Loading clears on login request

3. UI Improvements:
   - ✅ Theme-aware loading animations
   - ✅ Context-specific loading states
   - ✅ Proper hook implementations
   - ✅ Consistent styling

## In Progress

### Push Notification Monitoring
1. Notification Delivery:
   - ⏳ Monitor sound consistency
   - ⏳ Verify notification persistence
   - ⏳ Test various device states
   - ⏳ Document edge cases

### Chat System Monitoring
1. Subscription Management:
   - ⏳ Monitor subscription cleanup logs
   - ⏳ Verify cache isolation
   - ⏳ Test view switching behavior
   - ⏳ Performance impact analysis

### Testing Requirements
1. Registration Flow:
   - ⏳ SMS sending verification
   - ⏳ Navigation to Profile
   - ⏳ Button loading state
   - ⏳ Loading timeout
   - ⏳ Login request handling

2. Login Flow:
   - ⏳ SMS sending verification
   - ⏳ Navigation to Profile
   - ⏳ Modal auto-opening
   - ⏳ Modal loading state
   - ⏳ Loading timeout
   - ⏳ Login request handling

3. Theme Testing:
   - ⏳ Light theme loading visibility
   - ⏳ Dark theme loading visibility
   - ⏳ Animation color filters

## Pending
1. Documentation:
   - ⏳ Development setup instructions
   - ⏳ Complete dependency list
   - ⏳ Performance constraints
   - ⏳ Technical limitations

2. Future Improvements:
   - ⏳ Multilingual support implementation
   - ⏳ Additional error handling scenarios
   - ⏳ Performance optimizations
   - ⏳ Accessibility improvements

## Known Issues
1. Chat System:
   - ✅ Message mixing between views (FIXED)
   - ✅ Subscription cleanup issues (FIXED)
   - ✅ Cache isolation problems (FIXED)

2. Deep Linking:
   - ✅ URL schemes lost during prebuild (FIXED)
   - ✅ Missing CFBundleURLName entries (FIXED)

## Testing Status
1. Unit Tests:
   - ⏳ Hook implementations
   - ⏳ Component rendering
   - ⏳ Loading state management
   - ⏳ Deep link parsing logic

2. Integration Tests:
   - ⏳ Navigation flows
   - ⏳ SMS handling
   - ⏳ Login request handling
   - ⏳ Chat subscription management
   - ⏳ Deep linking flows:
     * Custom URL scheme handling
     * Universal Links handling
     * Initial URL processing
     * Runtime URL handling

3. E2E Tests:
   - ⏳ Registration flow
   - ⏳ Login flow
   - ⏳ Theme switching
   - ⏳ Chat view switching

## Next Steps
1. Monitor chat system improvements
2. Complete testing requirements
3. Document any issues found
4. Implement necessary fixes
5. Update documentation with findings
6. Plan future improvements
