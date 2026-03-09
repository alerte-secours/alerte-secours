import {
  AccessibilityInfo,
  findNodeHandle,
  InteractionManager,
} from "react-native";

export function setA11yFocus(refOrNode) {
  // RN's `setAccessibilityFocus` expects a native host node handle.
  // In practice, callers may pass:
  // - a ref object ({ current })
  // - a host component
  // - a composite component instance (invalid)
  // - null/undefined
  // We must never throw here, otherwise we can crash the whole app.
  try {
    const candidate = refOrNode?.current ?? refOrNode;
    const node = findNodeHandle(candidate);
    if (typeof node !== "number") return;
    AccessibilityInfo.setAccessibilityFocus(node);
  } catch (_e) {
    // noop
  }
}

export function setA11yFocusAfterInteractions(refOrNode) {
  InteractionManager.runAfterInteractions(() => setA11yFocus(refOrNode));
}
