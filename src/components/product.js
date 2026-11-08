import { h } from "../lib/dom.js";
import { data } from "../store.js";
import { money, unitPrice } from "../lib/format.js";
import { changeQuantity, markFavorite, removeFavorite } from "../actions.js";
import { Spinner } from "./common.js";

function cartItemFor(productId) {
  const items = data.cart && data.cart.items;
  return items ? items[String(productId)] || null : null;
}

export function AvailabilityBadge(product) {
  return h("span", { class: `badge badge-${product.availability.tone}` }, product.availability.label);
}

export function Heart(product) {
  return h(
    "button",
    {
      class: `heart${product.isFavorite ? " active" : ""}`,
      type: "button",
      title: product.isFavorite ? "Odebrat z oblíbených" : "Dát do oblíbených",
      onClick: (event) => {
        event.stopPropagation();
        if (product.isFavorite) removeFavorite(product.id);
        else markFavorite(product.id);
      },
    },
    "♥"
  );
}

export function QtyControl(product) {
  const item = cartItemFor(product.id);
  const quantity = item ? item.quantity : 0;
  const busy = Boolean(data.busy[product.id]);
  const unavailable = product.availability.orderable === false;

  if (quantity <= 0) {
    return h(
      "button",
      {
        class: "btn btn-primary add-btn",
        type: "button",
        title: "Do košíku",
        disabled: busy || unavailable,
        onClick: () => changeQuantity({ id: product.id, quantity: 0, orderFieldId: null }, 1),
      },
      busy ? Spinner() : "+1"
    );
  }

  const holder = { id: product.id, quantity, orderFieldId: item.orderFieldId };
  return h(
    "div",
    { class: "qty" },
    h("button", { type: "button", disabled: busy, onClick: () => changeQuantity(holder, -1) }, "−"),
    h("span", { class: "qty-value" }, String(quantity)),
    h("button", { type: "button", disabled: busy, onClick: () => changeQuantity(holder, 1) }, "+")
  );
}

export function ProductRow(product) {
  return h(
    "tr",
    null,
    h(
      "td",
      null,
      h(
        "div",
        { class: "cell-product" },
        product.image ? h("img", { class: "cell-thumb", src: product.image, alt: "", loading: "lazy" }) : h("div", { class: "cell-thumb" }),
        h(
          "div",
          null,
          h("a", { class: "cell-name", href: product.url, target: "_blank", rel: "noreferrer" }, product.name),
          product.amount ? h("div", { class: "cell-sub" }, product.amount) : null
        )
      )
    ),
    h("td", { class: "num" }, money(product.price.final, product.price.currency)),
    h("td", { class: "num" }, product.price.unit != null ? unitPrice(product.price.unit, product.unit) : "—"),
    h("td", null, AvailabilityBadge(product)),
    h("td", null, QtyControl(product))
  );
}
