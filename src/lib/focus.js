let pending = null;

// Ask the next render to move focus to the element with this data-focus-key.
export function requestFocus(key) {
  pending = key;
}

export function takePendingFocus() {
  const key = pending;
  pending = null;
  return key;
}
