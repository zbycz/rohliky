import { h } from "../lib/dom.js";
import { data } from "../store.js";
import * as list from "../shopping.js";
import { favoriteGroups, favoriteView } from "../selectors.js";
import { requestFocus } from "../lib/focus.js";
import { ProductsTable } from "./sections.js";

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

// The store change re-renders synchronously, so the focus request has to be
// registered before the item is inserted.
function createItemAt(index, text) {
  const item = list.newItem(text);
  requestFocus(item.id);
  return list.insert(index, item);
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
    createItemAt(list.items().length, text);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    const last = list.items().slice(-1)[0];
    if (last) focusByKey(last.id);
  }
}

function onItemKeyDown(event, item) {
  if (event.key === "Enter") {
    event.preventDefault();
    createItemAt(list.indexOf(item.id) + 1, "");
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
    const entries = list.items();
    const index = list.indexOf(item.id);
    const previous = entries[index - 1];
    const next = entries[index + 1];
    requestFocus(previous ? previous.id : next ? next.id : DRAFT_KEY);
    list.remove(item.id);
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
    }),
    h(
      "button",
      {
        class: "todo-expand",
        type: "button",
        title: item.open ? "Sbalit zboží" : "Rozbalit zboží",
        "data-focus-key": `expand-${item.id}`,
        onClick: () => list.toggleOpen(item.id),
      },
      item.open ? "▴" : "▸"
    )
  );
}

function Goods(item) {
  const assigned = new Set(list.items().flatMap((entry) => entry.products.map(String)));
  const groups = favoriteGroups()
    .map((group) => ({ name: group.name, items: group.items.filter((product) => !assigned.has(String(product.id))) }))
    .filter((group) => group.items.length > 0);
  const rows = item.products.map((id) => favoriteView(id)).filter(Boolean);
  return h(
    "div",
    { class: "goods" },
    ProductsTable(rows),
    groups.length
      ? h(
          "select",
          {
            class: "goods-select",
            title: "Přiřadit zboží z oblíbených",
            onChange: (event) => {
              if (event.target.value) list.addProduct(item.id, event.target.value);
            },
          },
          h("option", { value: "" }, "+ přidat"),
          groups.map((group) =>
            h(
              "optgroup",
              { label: group.name },
              group.items.map((product) => h("option", { value: String(product.id) }, product.name))
            )
          )
        )
      : h(
          "p",
          { class: "goods-empty" },
          data.favorites.length ? "Všechny oblíbené už jsou přiřazené." : "Nejdřív je potřeba načíst oblíbené."
        )
  );
}

function TodoItem(item) {
  return h(
    "div",
    { class: `todo-item${item.open ? " open" : ""}` },
    TodoRow(item),
    item.open ? Goods(item) : null
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
    entries.length ? h("div", { class: "todo-list" }, entries.map(TodoItem)) : null,
    entries.length === 0 ? DraftRow() : null,
    Hint()
  );
}
