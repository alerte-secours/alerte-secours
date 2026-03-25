let _resolver = null;
let _showModal = null;

export function registerHandler(showFn) {
  _showModal = showFn;
}

export function unregisterHandler() {
  _showModal = null;
  if (_resolver) {
    _resolver(false);
    _resolver = null;
  }
}

export function showDisclosure() {
  return new Promise((resolve) => {
    if (!_showModal) {
      // No handler registered (component not mounted), proceed without disclosure
      resolve(true);
      return;
    }
    _resolver = resolve;
    _showModal();
  });
}

export function resolveDisclosure(accepted) {
  if (_resolver) {
    _resolver(accepted);
    _resolver = null;
  }
}
