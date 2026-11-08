import { h } from "../lib/dom.js";

export function ShoppingList() {
  return h("div", { class: "card pad todo" }, h("p", { class: "empty" }, "Zatím prázdný seznam."));
}
