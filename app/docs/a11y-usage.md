# A11y usage guide (app-specific)

This document explains how to use the shared accessibility helpers exposed by [`src/lib/a11y/index.js`](src/lib/a11y/index.js:1) and the conventions we follow in this codebase.

## Shared helpers

The a11y helpers are re-exported from [`src/lib/a11y/index.js`](src/lib/a11y/index.js:1):

- `announceForA11y(message)`
- `announceForA11yIfScreenReaderEnabled(message)`
- `setA11yFocus(refOrNode)`
- `setA11yFocusAfterInteractions(refOrNode)`

### Announcements

Use announcements for **important state changes** that are not otherwise obvious to a screen reader user.

- Prefer short, user-facing messages.
- Keep the language aligned with the UI (French strings in this app).

Example:

```js
import { announceForA11y } from "~/lib/a11y";

await announceForA11y("Alerte envoyée");
```

Implementation lives in [`src/lib/a11y/announce.js`](src/lib/a11y/announce.js:1).

### Focus management

Use focus management when navigation or UI updates would otherwise leave screen reader focus in an unexpected place.

- `setA11yFocus(refOrNode)` sets focus immediately.
- `setA11yFocusAfterInteractions(refOrNode)` is safer after navigation, animations, or heavy re-renders.

Example:

```js
import React, { useRef } from "react";
import { View, Text } from "react-native";
import { setA11yFocusAfterInteractions } from "~/lib/a11y";

export function Example() {
  const titleRef = useRef(null);

  React.useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  return (
    <View>
      <Text ref={titleRef} accessibilityRole="header">Mon écran</Text>
    </View>
  );
}
```

Implementation lives in [`src/lib/a11y/focus.js`](src/lib/a11y/focus.js:1).

## Component-level conventions

### Buttons / Icon buttons

- Provide `accessibilityLabel` (what it is) and `accessibilityHint` (what it does) for icon-only actions.
- Keep labels/hints in **French** to match the app.

Examples in headers:

- [`src/navigation/HeaderRight.js`](src/navigation/HeaderRight.js:70)
- [`src/navigation/HeaderLeft.js`](src/navigation/HeaderLeft.js:19)

### Text inputs

- Provide `accessibilityLabel` and a French `accessibilityHint`.
- Prefer a clear `placeholder` and keep it aligned with the on-screen label if any.

Example: [`src/containers/ChatInput/TextArea.js`](src/containers/ChatInput/TextArea.js:48).

## Test IDs and a11y

`testID` props are for test automation, not for accessibility.

- Add `testID` only when it is stable and safe.
- Follow the naming rules in [`docs/testids.md`](docs/testids.md:1).

