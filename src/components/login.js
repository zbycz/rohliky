import { h } from "../lib/dom.js";
import { config, data, setConfig, setData } from "../store.js";
import { login } from "../actions.js";
import { hasProxy } from "../api/client.js";
import { Banner, Spinner } from "./common.js";

const form = {
  email: config.auth.email || "",
  password: config.auth.remember ? config.auth.password || "" : "",
  remember: Boolean(config.auth.remember),
};

async function onSubmit(event) {
  event.preventDefault();
  const elements = event.target.elements;
  form.email = elements.email.value.trim();
  form.password = elements.password.value;
  form.remember = elements.remember.checked;
  setConfig({ auth: { ...config.auth, email: form.email, remember: form.remember } });
  await login(form.email, form.password, form.remember);
}

export function LoginView() {
  const busy = data.status === "loading";
  return h(
    "div",
    { class: "login-wrap" },
    h(
      "div",
      { class: "card pad" },
      h("h1", { style: { marginTop: "0" } }, "Přihlášení do Rohlíku"),
      h("p", { class: "hint" }, "Přihlas se svým účtem Rohlik.cz. Vše se ukládá jen do tohoto prohlížeče."),
      hasProxy()
        ? null
        : Banner(
            "info",
            "Prohlížeč nemůže kvůli CORS mluvit s Rohlik.cz napřímo. V „Nastavení“ zadej adresu vlastní proxy (viz README)."
          ),
      data.status === "error" && data.error ? Banner("error", data.error) : null,
      h(
        "form",
        { onSubmit },
        h(
          "div",
          { class: "field" },
          h("label", { for: "login-email" }, "E-mail"),
          h("input", {
            id: "login-email",
            name: "email",
            type: "email",
            value: form.email,
            autocomplete: "username",
            required: true,
          })
        ),
        h(
          "div",
          { class: "field" },
          h("label", { for: "login-password" }, "Heslo"),
          h("input", {
            id: "login-password",
            name: "password",
            type: "password",
            value: form.password,
            autocomplete: "current-password",
            required: true,
          })
        ),
        h(
          "label",
          { class: "checkbox" },
          h("input", { type: "checkbox", name: "remember", checked: form.remember }),
          "Zapamatovat si přihlášení v tomto prohlížeči"
        ),
        h(
          "button",
          { class: "btn btn-primary", type: "submit", disabled: busy, style: { width: "100%", justifyContent: "center" } },
          busy ? Spinner() : "Přihlásit se"
        )
      ),
      h(
        "div",
        { style: { marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("button", { class: "btn btn-ghost", type: "button", onClick: () => setData({ settingsOpen: true }) }, "Nastavení"),
        h("a", { href: "https://www.rohlik.cz", target: "_blank", rel: "noreferrer" }, "Otevřít rohlik.cz")
      )
    )
  );
}
