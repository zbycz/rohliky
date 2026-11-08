import { h } from "../lib/dom.js";
import { config, data, setConfig, setData } from "../store.js";
import { logout, selectAddress } from "../actions.js";

function close() {
  setData({ settingsOpen: false });
}

async function handleLogout() {
  await logout();
  close();
}

function field(label, name, value, placeholder) {
  return h(
    "div",
    { class: "field" },
    h("label", null, label),
    h("input", { name, value, placeholder: placeholder || "" })
  );
}

function checkbox(label, name, checked, onChange) {
  return h(
    "label",
    { class: "checkbox" },
    h("input", { type: "checkbox", name, checked: checked ? true : null, onChange }),
    label
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
  setConfig({ session: elements.session.value.trim() });
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
          field("Session token (PHPSESSION)", "session", config.session, "nepovinné, raději se přihlas formulářem"),
          data.addresses.length ? h("div", { class: "field" }, h("label", null, "Aktivní uložená adresa"), addressSelect()) : null,
          checkbox("Zaokrouhlovat ceny na 5", "roundPrices", config.roundPrices, (event) =>
            setConfig({ roundPrices: event.target.checked })
          ),
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
        ),
        h(
          "div",
          { class: "settings-actions" },
          h(
            "a",
            { href: "https://github.com/zbycz/rohliky", target: "_blank", rel: "noreferrer" },
            "Zdrojový kód na GitHubu"
          ),
          h("button", { class: "btn", type: "button", onClick: handleLogout }, "Odhlásit")
        )
      )
    )
  );
}
