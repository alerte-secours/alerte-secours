# Test IDs conventions

This app uses React Native `testID` props to support **E2E tests** (Detox / RN testing tools) and to enable reliable UI targeting without relying on translated text.

## Goals

- Stable selectors for tests across refactors.
- Human-readable IDs that encode *where* and *what*.
- Low risk: adding `testID` must not change UI behavior.

## When to add a `testID`

Add a `testID` when the element is:

- A primary action (CTA) users tap.
- Navigation chrome (header left/back/menu, header right quick actions).
- A key form control (input, send button, attachment/mic button).
- A container representing a screen root (rare; see existing example).

Avoid adding `testID` to purely decorative views/icons.

## Naming rules

### Format

Use lowercase, kebab-case.

Recommended pattern:

```
<area>-<screen-or-component>-<element>
```

Examples:

- `header-left-back`
- `header-right-menu`
- `send-alert-cta-red`
- `chat-input-send`

### Prefixes

Use a consistent prefix based on where the element lives:

- `header-left-*` for left header controls
- `header-right-*` for right header controls
- `send-alert-*` for Send Alert screen actions
- `chat-input-*` for ChatInput controls

### Uniqueness

Within a given screen/component, each `testID` must be unique.

### Do not encode text

Do not include localized labels (e.g. avoid `envoyer-message`). IDs must remain stable even if copy changes.

## Mapping to files

- Header buttons: [`src/navigation/HeaderLeft.js`](src/navigation/HeaderLeft.js:1), [`src/navigation/HeaderRight.js`](src/navigation/HeaderRight.js:1)
- Send Alert CTAs: [`src/scenes/SendAlert/index.js`](src/scenes/SendAlert/index.js:1)
- Chat input controls: [`src/containers/ChatInput/index.js`](src/containers/ChatInput/index.js:1)

## Existing usage

- Screen root container example: [`src/layout/Layout.js`](src/layout/Layout.js:49) uses `testID="main-layout"`.

