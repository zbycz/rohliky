import { h } from "../lib/dom.js";
import { data } from "../store.js";

export function Toasts() {
  if (!data.toasts.length) return null;
  return h(
    "div",
    { class: "toasts" },
    data.toasts.map((item) => h("div", { class: `toast${item.tone === "error" ? " error" : ""}` }, item.message))
  );
}
