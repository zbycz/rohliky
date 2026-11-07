import { h } from "../lib/dom.js";
import { hasAccount } from "../actions.js";
import { Topbar } from "./topbar.js";
import { LoginView } from "./login.js";
import { Sections } from "./sections.js";
import { CartPanel } from "./cartPanel.js";
import { SettingsModal } from "./settings.js";
import { Toasts } from "./toasts.js";

export function App() {
  const authed = hasAccount();
  return h(
    "div",
    { class: "app-shell" },
    authed ? Topbar() : null,
    authed
      ? h("main", { class: "main" }, h("div", { class: "content" }, Sections()), CartPanel())
      : h("main", { class: "main single" }, LoginView()),
    SettingsModal(),
    Toasts()
  );
}
