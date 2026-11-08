import { render } from "./lib/dom.js";
import { subscribe } from "./store.js";
import { hasAccount, refresh } from "./actions.js";
import { App } from "./components/app.js";
import { takePendingFocus } from "./lib/focus.js";

const root = document.getElementById("app");

// A full re-render replaces every node, so remember what was focused (and the
// caret) and restore it once the new tree is in place.
function captureFocus() {
  const active = document.activeElement;
  if (!active || !active.dataset) return { key: null, selection: null };
  const key = active.dataset.focusKey || null;
  let selection = null;
  try {
    if (typeof active.selectionStart === "number") selection = [active.selectionStart, active.selectionEnd];
  } catch {
    selection = null;
  }
  return { key, selection };
}

function draw() {
  const { key, selection } = captureFocus();
  render(App(), root);
  const pending = takePendingFocus();
  const target = pending || key;
  if (!target) return;
  const el = root.querySelector(`[data-focus-key="${target}"]`);
  if (!el) return;
  el.focus();
  if (!pending && selection && typeof el.setSelectionRange === "function") {
    try {
      el.setSelectionRange(selection[0], selection[1]);
    } catch {
      null;
    }
  }
}

subscribe(draw);
draw();

if (hasAccount()) refresh();
