# A11y audit log

Keep this log lightweight and practical. Prefer short entries that state:

- what was checked
- what was fixed
- what remains

Format:

```
YYYY-MM-DD - Area - Result - Notes
```

## Log

- 2026-01-06 - P0 conventions - Added documentation and testID conventions; added minimal `testID` for header actions, Send Alert CTAs, and ChatInput controls. (lint clean)
# Accessibility Audit Log

This log tracks manual accessibility verification for WCAG 2.2 AA on iOS (VoiceOver) and Android (TalkBack).

Reference docs:
- WCAG mapping: [docs/a11y-wcag22-aa.md](docs/a11y-wcag22-aa.md:1)
- VoiceOver runbook: [docs/qa-voiceover.md](docs/qa-voiceover.md:1)
- TalkBack runbook: [docs/qa-talkback.md](docs/qa-talkback.md:1)
- A11y target inventory: [docs/a11y-audit-targets.md](docs/a11y-audit-targets.md:1)
- TestID convention: [docs/testids.md](docs/testids.md:1)

---

## Template (copy/paste for each audit run)

### Audit run

- Date:
- Commit SHA:
- App version/build:
- Tester:

#### Devices

- iOS device:
- iOS version:
- VoiceOver settings used:

- Android device:
- Android version:
- TalkBack settings used:

#### Global checks (apply on every screen)

- [ ] Focus order matches visual order
- [ ] No focus traps (especially maps, drawers, modals)
- [ ] Controls have correct name/role/state
- [ ] Target size: 44x44 pt (iOS) / 48dp (Android) for primary controls
- [ ] Dynamic type / font scaling does not clip or hide text
- [ ] Error/success states are perceivable and announced when appropriate
- [ ] No duplicate focusable decorative elements

#### Results summary

- Blockers:
- Majors:
- Minors:
- Notes:

---

### Core journeys checklist (fill out)

#### 1) Send Alert (P0)

Targets:
- [src/scenes/SendAlert/index.js](src/scenes/SendAlert/index.js:1)
- [src/scenes/SendAlert/RadarModal.js](src/scenes/SendAlert/RadarModal.js:1)

Steps:
- [ ] Navigate to Send Alert
- [ ] Help toggle readable + state announced
- [ ] Radar button opens modal, focus goes to modal title
- [ ] Radar loading/success/error announced once (no spam)
- [ ] Close radar modal, focus returns to radar trigger
- [ ] All CTAs (red/yellow/green/unknown/call) are reachable and correctly described

Findings:
- iOS:
- Android:

#### 2) Chat + Messaging (P0)

Targets:
- [src/containers/ChatInput/index.js](src/containers/ChatInput/index.js:1)
- [src/containers/ChatMessages/index.js](src/containers/ChatMessages/index.js:1)
- [src/lib/expo-audio-player/index.js](src/lib/expo-audio-player/index.js:1)

Precondition:
- An alert with an open chat thread is available (or use a staging account).

Steps:
- [ ] Open chat thread
- [ ] Message list reads in correct order (sender, time, content)
- [ ] Text input is labeled and discoverable (testID `chat-input-text`)
- [ ] Send/mic control describes current action
- [ ] Start recording: announcement once
- [ ] Stop recording: announcement once
- [ ] Delete recording: destructive hint present
- [ ] Send text message: focus remains stable
- [ ] Play/pause audio: control labeled + state conveyed
- [ ] New incoming message: concise announcement (no spam)

Findings:
- iOS:
- Android:

#### 3) Map + Routing (P0)

Targets:
- [src/scenes/AlertCurMap/index.js](src/scenes/AlertCurMap/index.js:1)
- [src/containers/Map/MapView.js](src/containers/Map/MapView.js:1)
- [src/scenes/AlertCurMap/RoutingSteps.js](src/scenes/AlertCurMap/RoutingSteps.js:1)

Steps:
- [ ] Open Alert map screen
- [ ] Map surface is not focusable (no trap)
- [ ] Overlay controls are reachable and described (zoom/recenter/toggles)
- [ ] Non-visual alternative entry is discoverable before the map
- [ ] Open route steps list/drawer, focus goes to title
- [ ] Close route steps list/drawer, focus returns to trigger

Findings:
- iOS:
- Android:

#### 4) Settings / Permissions (P0)

Targets:
- [src/scenes/Params/Permissions.js](src/scenes/Params/Permissions.js:1)
- [src/containers/PermissionWizard/index.js](src/containers/PermissionWizard/index.js:1)

Steps:
- [ ] Open Permissions settings
- [ ] Each permission item exposes switch semantics (role switch + checked/disabled)
- [ ] Blocked permission shows accessible button to open OS settings
- [ ] Permission request success/failure is announced once
- [ ] Permission wizard screens have headings and initial focus

Findings:
- iOS:
- Android:

#### 5) Profile + Account management (P0)

Targets:
- [src/scenes/Profile/Form.js](src/scenes/Profile/Form.js:1)
- [src/scenes/Profile/AvatarUploader.js](src/scenes/Profile/AvatarUploader.js:1)
- [src/scenes/Profile/AccountManagement.js](src/scenes/Profile/AccountManagement.js:1)

Steps:
- [ ] Open Profile
- [ ] Edit fields: labels and errors announced
- [ ] Open avatar edit modal: focus to modal header
- [ ] Close avatar edit modal: focus returns to trigger
- [ ] Open account modal(s): focus to modal header
- [ ] Destructive action confirmation: clear label/hint and error focus

Findings:
- iOS:
- Android:

---

## Audit runs

<!-- Paste completed runs above this line -->
