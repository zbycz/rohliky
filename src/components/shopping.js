import { h } from "../lib/dom.js";
import * as list from "../shopping.js";
import { requestFocus } from "../lib/focus.js";

const DRAFT_KEY = "new";

let draft = "";

function focusByKey(key) {
  const el = document.querySelector(`[data-focus-key="${key}"]`);
  if (el) el.focus();
}

function moveFocus(id, delta) {
  const entries = list.items();
  const next = entries[list.indexOf(id) + delta];
  if (next) focusByKey(next.id);
}

function onDraftInput(event) {
  draft = event.target.value;
}

function onDraftKeyDown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    draft = "";
    list.add(list.items().length, text);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    const last = list.items().slice(-1)[0];
    if (last) focusByKey(last.id);
  }
}

function onItemKeyDown(event, item) {
  if (event.key === "Enter") {
    event.preventDefault();
    const created = list.add(list.indexOf(item.id) + 1);
    requestFocus(created.id);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    if (event.shiftKey) list.move(item.id, 1);
    else moveFocus(item.id, 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (event.shiftKey) list.move(item.id, -1);
    else moveFocus(item.id, -1);
  } else if (event.key === "Backspace" && item.text === "") {
    event.preventDefault();
    const previous = list.items()[list.indexOf(item.id) - 1];
    list.remove(item.id);
    if (previous) requestFocus(previous.id);
  }
}

function TodoRow(item) {
  return h(
    "div",
    { class: `todo-row${item.done ? " done" : ""}` },
    h("input", {
      class: "todo-check",
      type: "checkbox",
      checked: item.done ? true : null,
      title: "Hotovo",
      onChange: () => list.toggle(item.id),
    }),
    h("input", {
      class: "todo-input",
      type: "text",
      value: item.text,
      "data-focus-key": item.id,
      autocomplete: "off",
      onInput: (event) => list.setText(item.id, event.target.value),
      onKeyDown: (event) => onItemKeyDown(event, item),
    })
  );
}

function DraftRow() {
  return h(
    "div",
    { class: "todo-row draft" },
    h("span", { class: "todo-plus" }, "+"),
    h("input", {
      class: "todo-input",
      type: "text",
      value: draft,
      placeholder: "+",
      "data-focus-key": DRAFT_KEY,
      autocomplete: "off",
      onInput: onDraftInput,
      onKeyDown: onDraftKeyDown,
    })
  );
}

function Hint() {
  return h(
    "p",
    { class: "todo-hint" },
    h("kbd", null, "Enter"),
    " přidá položku pod aktuální · ",
    h("kbd", null, "↑"),
    h("kbd", null, "↓"),
    " pohyb mezi položkami · ",
    h("kbd", null, "Shift"),
    "+",
    h("kbd", null, "↑"),
    h("kbd", null, "↓"),
    " přesune položku · ",
    h("kbd", null, "Backspace"),
    " smaže prázdnou položku"
  );
}

export function ShoppingList() {
  const entries = list.items();
  return h(
    "div",
    { class: "card pad todo" },
    entries.length ? h("div", { class: "todo-list" }, entries.map(TodoRow)) : null,
    DraftRow(),
    Hint()
  );
}
