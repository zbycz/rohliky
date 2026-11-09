import { h } from "../lib/dom.js";
import { data } from "../store.js";
import * as list from "../shopping.js";
import { favoriteGroups, favoriteView, cartItemView } from "../selectors.js";
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

let measurer = null;

// Only the text itself is editable; the rest of the row toggles the goods panel,
// so the input has to shrink to its content instead of stretching across the row.
function measureTextWidth(text) {
  if (!measurer) {
    measurer = document.createElement("span");
    measurer.className = "todo-input";
    measurer.style.cssText =
      "position:absolute; left:-9999px; top:-9999px; visibility:hidden; white-space:pre; pointer-events:none;";
    document.body.appendChild(measurer);
  }
  measurer.textContent = text || " ";
  return measurer.getBoundingClientRect().width;
}

function onRowClick(event, item) {
  if (event.target.closest("input") || event.target.closest("button")) return;
  list.toggleOpen(item.id);
}

function Thumbs(item) {
  const inCart = item.products.map(cartItemView).filter((product) => product && product.image);
  if (!inCart.length) return null;
  return h(
    "div",
    { class: "todo-thumbs", title: "Zboží v košíku" },
    inCart.map((product) =>
      h(
        "span",
        { class: "todo-thumb-item" },
        product.quantity > 1 ? h("span", { class: "todo-thumb-qty" }, String(product.quantity)) : null,
        h("img", { class: "todo-thumb", src: product.image, alt: "", title: product.name, loading: "lazy" })
      )
    )
  );
}

function TodoRow(item) {
  return h(
    "div",
    { class: `todo-row${item.done ? " done" : ""}`, onClick: (event) => onRowClick(event, item) },
    h("input", {
      class: "todo-check",
      type: "checkbox",
      checked: item.done ? true : null,
      title: "Hotovo",
      onChange: () => list.toggle(item.id),
    }),
    h("input", {
      class: "todo-input auto",
      type: "text",
      value: item.text,
      "data-focus-key": item.id,
      autocomplete: "off",
      style: { width: `${Math.ceil(measureTextWidth(item.text))}px` },
      onInput: (event) => list.setText(item.id, event.target.value),
      onKeyDown: (event) => onItemKeyDown(event, item),
    }),
    h("div", { class: "todo-fill" }),
    Thumbs(item),
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

function RemoveButton(item, product) {
  return h(
    "button",
    {
      class: "goods-remove",
      type: "button",
      title: "Odebrat z této položky",
      onClick: () => list.removeProduct(item.id, product.id),
    },
    "✕"
  );
}

function Goods(item) {
  const assigned = list.assignedIds();
  const groups = favoriteGroups()
    .map((group) => ({ name: group.name, items: group.items.filter((product) => !assigned.has(String(product.id))) }))
    .filter((group) => group.items.length > 0);
  const rows = item.products.map((id) => favoriteView(id)).filter(Boolean);
  return h(
    "div",
    { class: "goods" },
    ProductsTable(rows, true, (product) => RemoveButton(item, product)),
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
