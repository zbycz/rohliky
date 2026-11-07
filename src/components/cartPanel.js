import { h } from "../lib/dom.js";
import { data } from "../store.js";
import { changeQuantity } from "../actions.js";
import { cartCount, money } from "../lib/format.js";
import { cartItems } from "../selectors.js";
import { CountPill } from "./common.js";

function CartRow(item) {
  return h(
    "div",
    { class: "cart-row" },
    item.image ? h("img", { class: "cart-thumb", src: item.image, alt: "", loading: "lazy" }) : h("div", { class: "cart-thumb" }),
    h(
      "div",
      { class: "cart-main" },
      h("a", { class: "cart-name", href: item.url, target: "_blank", rel: "noreferrer", title: item.name }, item.name),
      h("div", { class: "cart-sub" }, money(item.price.final, item.price.currency))
    ),
    h(
      "div",
      { class: "qty" },
      h("button", { type: "button", disabled: Boolean(data.busy[item.id]), onClick: () => changeQuantity(item, -1) }, "−"),
      h("span", { class: "qty-value" }, String(item.quantity)),
      h("button", { type: "button", disabled: Boolean(data.busy[item.id]), onClick: () => changeQuantity(item, 1) }, "+")
    )
  );
}

export function CartPanel() {
  const items = cartItems();
  const cart = data.cart;
  return h(
    "aside",
    { class: "card pad side" },
    h("div", { class: "section-head" }, h("h2", null, "Košík"), CountPill(`${cartCount(cart)} ks`)),
    items.length === 0
      ? h("div", { class: "empty" }, "Košík je prázdný")
      : h("div", { class: "cart-list" }, items.map(CartRow)),
    h(
      "div",
      { class: "cart-total" },
      h("span", null, "Celkem"),
      h("span", null, money(cart ? cart.totalPrice : 0, "Kč"))
    )
  );
}
