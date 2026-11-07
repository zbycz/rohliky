import { render } from "./lib/dom.js";
import { subscribe } from "./store.js";
import { hasAccount, refresh } from "./actions.js";
import { App } from "./components/app.js";

const root = document.getElementById("app");

function draw() {
  render(App(), root);
}

subscribe(draw);
draw();

if (hasAccount()) refresh();
