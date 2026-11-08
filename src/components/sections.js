import { h } from "../lib/dom.js";
import { config, data } from "../store.js";
import { sections } from "../selectors.js";
import { ProductCard, ProductRow } from "./product.js";
import { Banner, Spinner } from "./common.js";

function Grid(items) {
  return h("div", { class: "grid" }, items.map(ProductCard));
}

function Table(items, withHead = true) {
  return h(
    "div",
    { class: "table-wrap" },
    h(
      "table",
      { class: "products" },
      withHead
        ? h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", null, "Produkt"),
              h("th", null, "Cena"),
              h("th", null, "Cena / jednotka"),
              h("th", null, "Dostupnost"),
              h("th", null, "Množství"),
              h("th", null, "")
            )
          )
        : null,
      h("tbody", null, items.map(ProductRow))
    )
  );
}

function ProductsBlock(items) {
  return config.view === "table" ? Table(items) : Grid(items);
}

function ExtrasBlock(extras) {
  return h(
    "div",
    { class: "extras" },
    h("div", { class: "extras-head" }, `Není v oblíbených, ale je v košíku (${extras.length})`),
    config.view === "table" ? Table(extras, false) : Grid(extras)
  );
}

function CategorySection(group) {
  return h(
    "section",
    { class: "category" },
    h(
      "div",
      { class: "section-head" },
      h("h2", null, group.name)
    ),
    group.items.length ? ProductsBlock(group.items) : null,
    group.extras.length ? ExtrasBlock(group.extras) : null
  );
}

export function Sections() {
  const groups = sections();
  if (data.loadingFavorites && data.favorites.length === 0) {
    return h("div", { class: "card loading-block" }, Spinner(true), "Načítám oblíbené…");
  }
  if (data.status === "error") {
    return h("div", { class: "card pad" }, Banner("error", data.error));
  }
  if (groups.length === 0) {
    return h("div", { class: "card pad empty" }, "Zatím tu nejsou žádné oblíbené položky ani položky v košíku.");
  }
  return h("div", { class: "stack" }, groups.map(CategorySection));
}
