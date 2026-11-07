import { h } from "../lib/dom.js";

export function Spinner(dark = false) {
  return h("span", { class: `spinner${dark ? " dark" : ""}` });
}

export function Banner(tone, text) {
  return h("div", { class: `banner banner-${tone}` }, text);
}

export function CountPill(value) {
  return h("span", { class: "count-pill" }, value);
}
