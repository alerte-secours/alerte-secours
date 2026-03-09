# A11y audit targets

This file lists the **P0 screens/components** that we audit first.

Each target should be validated with:

- iOS VoiceOver (see [`docs/qa-voiceover.md`](docs/qa-voiceover.md:1))
- Android TalkBack (see [`docs/qa-talkback.md`](docs/qa-talkback.md:1))
- Static checks (ESLint a11y rules) and smoke E2E tests.

## P0 targets

### Navigation chrome

- Header left (back / home fallback)
  - File: [`src/navigation/HeaderLeft.js`](src/navigation/HeaderLeft.js:1)
  - Risks: icon-only action labeling, predictable behavior.

- Header right (quick nav + menu)
  - File: [`src/navigation/HeaderRight.js`](src/navigation/HeaderRight.js:1)
  - Risks: icon-only labeling, unread indicators.

### Send Alert

- Primary alert CTAs (red/yellow/green/call/unknown)
  - File: [`src/scenes/SendAlert/index.js`](src/scenes/SendAlert/index.js:1)
  - Risks: color-only meaning, CTA clarity, focus order.

### Chat

- Chat input (text field, send/mic, delete recording)
  - File: [`src/containers/ChatInput/index.js`](src/containers/ChatInput/index.js:1)
  - Risks: custom touchables, dynamic mode switching, recording countdown.

## Nice-to-have targets (later)

- Drawer navigation and menu items
- Permissions wizard flows
- Maps and map overlays
- Notifications settings

