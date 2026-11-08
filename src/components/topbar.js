import { h } from "../lib/dom.js";
import { config, data, setConfig, setData } from "../store.js";
import { refresh } from "../actions.js";
import { cartCount } from "../lib/format.js";

function addressLabel() {
  const entry = data.addresses.find((candidate) => candidate.address && candidate.address.id === config.address.currentId);
  if (entry && entry.address && entry.address.fullAddress) return entry.address.fullAddress;
  return "";
}

export function Topbar() {
  return h(
    "header",
    { class: "topbar" },
    h(
      "div",
      { class: "topbar-inner" },
      h("div", { class: "brand" }, h("span", { class: "brand-mark" }, "🛒"), "Rohlík oblíbené"),
      h("div", { class: "topbar-spacer" }),
      h("div", { class: "address-chip", title: addressLabel() }, "📍", h("strong", null, addressLabel())),
      h(
        "div",
        { class: "segmented", role: "group" },
        h(
          "button",
          { type: "button", class: config.view === "grid" ? "active" : "", onClick: () => setConfig({ view: "grid" }) },
          "Mřížka"
        ),
        h(
          "button",
          { type: "button", class: config.view === "table" ? "active" : "", onClick: () => setConfig({ view: "table" }) },
          "Tabulka"
        )
      ),
      h("button", { class: "btn", type: "button", onClick: () => refresh() }, "↻ Obnovit"),
      h("button", { class: "btn", type: "button", onClick: () => setData({ settingsOpen: true }) }, "⚙️ Nastavení")
    )
  );
}
