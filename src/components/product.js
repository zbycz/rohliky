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

function PriceRow(product) {
  const price = product.price;
  return h(
    "div",
    { class: "price-row" },
    h("span", { class: "price" }, money(price.final, price.currency)),
    price.onSale ? h("span", { class: "price-was" }, money(price.original, price.currency)) : null,
    price.unit != null ? h("span", { class: "price-unit" }, unitPrice(price.unit, product.unit)) : null
  );
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
  const unavailable = product.availability.label === "Není skladem";

  if (quantity <= 0) {
    return h(
      "button",
      {
        class: "btn btn-primary add-btn",
        type: "button",
        disabled: busy || unavailable,
        onClick: () => changeQuantity({ id: product.id, quantity: 0, orderFieldId: null }, 1),
      },
      busy ? Spinner() : "Do košíku"
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

export function ProductCard(product) {
  return h(
    "article",
    { class: "product" },
    h(
      "div",
      { class: "product-media" },
      product.image ? h("img", { src: product.image, alt: product.name, loading: "lazy" }) : null
    ),
    h(
      "div",
      { class: "product-body" },
      h("div", { class: "product-name", title: product.name }, product.name),
      product.amount ? h("div", { class: "product-amount" }, product.amount) : null,
      PriceRow(product),
      AvailabilityBadge(product),
      h("div", { class: "product-foot" }, QtyControl(product), Heart(product))
    )
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
          h("div", { class: "cell-name" }, product.name),
          product.amount ? h("div", { class: "cell-sub" }, product.amount) : null
        )
      )
    ),
    h("td", { class: "num" }, money(product.price.final, product.price.currency)),
    h("td", { class: "num" }, product.price.unit != null ? unitPrice(product.price.unit, product.unit) : "—"),
    h("td", null, AvailabilityBadge(product)),
    h("td", null, QtyControl(product)),
    h("td", null, Heart(product))
  );
}
