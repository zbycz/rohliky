import { h } from "../lib/dom.js";
import { config, data, setConfig, setData } from "../store.js";
import { selectAddress } from "../actions.js";

function close() {
  setData({ settingsOpen: false });
}

function field(label, name, value, placeholder) {
  return h(
    "div",
    { class: "field" },
    h("label", null, label),
    h("input", { name, value, placeholder: placeholder || "" })
  );
}

function onAddressChange(event) {
  const entry = data.addresses.find((candidate) => candidate.address && candidate.address.id === Number(event.target.value));
  if (entry && entry.address) selectAddress(entry.address);
}

function addressSelect() {
  return h(
    "select",
    { name: "addressId", onChange: onAddressChange },
    data.addresses.map((entry) =>
      h(
        "option",
        { value: entry.address.id, selected: entry.address.id === config.address.currentId ? true : null },
        entry.address.fullAddress
      )
    )
  );
}

function onSave(event) {
  event.preventDefault();
  const elements = event.target.elements;
  setConfig({
    api: {
      ...config.api,
      proxyUrl: elements.proxyUrl.value.trim(),
      baseUrl: elements.baseUrl.value.trim() || "https://www.rohlik.cz",
    },
    session: elements.session.value.trim(),
    address: { ...config.address, query: elements.addressQuery.value.trim() },
  });
  close();
}

export function SettingsModal() {
  if (!data.settingsOpen) return null;
  return h(
    "div",
    {
      class: "modal-backdrop",
      onClick: (event) => {
        if (event.target === event.currentTarget) close();
      },
    },
    h(
      "div",
      { class: "modal" },
      h(
        "div",
        { class: "modal-head" },
        h("h2", null, "Nastavení"),
        h("button", { class: "btn btn-ghost", type: "button", onClick: close }, "Zavřít")
      ),
      h(
        "div",
        { class: "modal-body" },
        h(
          "p",
          { class: "hint" },
          "Všechna nastavení, tokeny i configy se ukládají do jediného klíče „rohliky“ v localStorage."
        ),
        h(
          "form",
          { onSubmit: onSave },
          field("Proxy URL (CORS)", "proxyUrl", config.api.proxyUrl, "https://tvuj-cors-proxy.workers.dev"),
          field("Základní URL Rohlik.cz", "baseUrl", config.api.baseUrl, "https://www.rohlik.cz"),
          field("Session token (PHPSESSION)", "session", config.session, "nepovinné, raději se přihlas formulářem"),
          field("Doručovací adresa (popisek)", "addressQuery", config.address.query, "Ke Džbánu 8, Praha 6"),
          data.addresses.length ? h("div", { class: "field" }, h("label", null, "Aktivní uložená adresa"), addressSelect()) : null,
          h(
            "button",
            { class: "btn btn-primary", type: "submit", style: { width: "100%", justifyContent: "center" } },
            "Uložit"
          )
        ),
        h(
          "p",
          { class: "hint", style: { marginTop: "14px" } },
          "Session token najdeš v DevTools → Application → Cookies → rohlik.cz → PHPSESSION."
        )
      )
    )
  );
}
