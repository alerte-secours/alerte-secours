# A11y baseline: WCAG 2.2 AA (practical checklist)

This document is a **practical interpretation** of WCAG 2.2 AA for this React Native app.

Scope: iOS VoiceOver and Android TalkBack.

## P0 baseline (must-have)

### Perceivable

- **Text alternatives**: icon-only buttons have `accessibilityLabel` and (when helpful) `accessibilityHint`.
  - Example: header icon buttons in [`src/navigation/HeaderRight.js`](src/navigation/HeaderRight.js:72).

- **Contrast**: text and icons meet AA contrast against their background.
  - Note: color-coded alert levels (red/yellow/green) must remain readable.

### Operable

- **Keyboard/switch navigation**: focus order is logical, no traps.
- **Touch target size**: interactive controls are large enough (aim for ~44x44pt).
  - Header icons and chat controls should remain comfortably tappable.

- **No time limits without control**: if an action auto-triggers (e.g. recording timeout), user feedback is provided.

### Understandable

- **Labels and instructions**: inputs and icon buttons expose meaningful labels in French.
- **Consistent navigation**: header left/back/menu behavior stays consistent.

### Robust

- **Role and state**: use `accessibilityRole` where the default is ambiguous (e.g. custom touchables).
- Avoid breaking semantics with nested touchables.

## App-specific high-risk areas

- **Send Alert**: primary CTAs must be discoverable and understandable by screen readers.
  - Screen: [`src/scenes/SendAlert/index.js`](src/scenes/SendAlert/index.js:99)

- **Chat Input**: send/microphone/delete controls must be labeled and easily reachable.
  - Component: [`src/containers/ChatInput/index.js`](src/containers/ChatInput/index.js:370)

- **Navigation headers**: icon-only buttons require clear labels.
  - Files: [`src/navigation/HeaderLeft.js`](src/navigation/HeaderLeft.js:1), [`src/navigation/HeaderRight.js`](src/navigation/HeaderRight.js:1)

## What we track

- Audit targets: [`docs/a11y-audit-targets.md`](docs/a11y-audit-targets.md:1)
- Audit log: [`docs/a11y-audit-log.md`](docs/a11y-audit-log.md:1)

