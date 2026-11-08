import { h } from "../lib/dom.js";
import { config, data, setData } from "../store.js";
import { refresh } from "../actions.js";
import { Spinner } from "./common.js";

function addressLabel() {
  const entry = data.addresses.find((candidate) => candidate.address && candidate.address.id === config.address.currentId);
  if (entry && entry.address && entry.address.fullAddress) return entry.address.fullAddress;
  return "";
}

function RefreshButton() {
  const state = data.refreshState || "idle";
  const onClick = async () => {
    if (state === "busy") return;
    setData({ refreshState: "busy" });
    try {
      await refresh();
    } finally {
      setData({ refreshState: "done" });
      setTimeout(() => {
        if (data.refreshState === "done") setData({ refreshState: "idle" });
      }, 1600);
    }
  };
  return h(
    "button",
    {
      class: `btn refresh-btn${state === "done" ? " btn-success" : ""}`,
      type: "button",
      disabled: state === "busy",
      onClick,
    },
    state === "busy" ? Spinner() : null,
    state === "busy" ? "Obnovuji…" : state === "done" ? "✓ Obnoveno" : "↻ Obnovit"
  );
}

export function Topbar() {
  return h(
    "header",
    { class: "topbar" },
    h(
      "div",
      { class: "topbar-inner" },
      h("div", { class: "brand" }, h("span", { class: "brand-mark" }, "🛒"), h("span", { class: "brand-name" }, "Rohlík oblíbené")),
      h("div", { class: "topbar-spacer" }),
      h("div", { class: "address-chip", title: addressLabel() }, "📍", h("strong", null, addressLabel())),
      RefreshButton(),
      h("button", { class: "btn", type: "button", onClick: () => setData({ settingsOpen: true }) }, "⚙️ Nastavení")
    )
  );
}
