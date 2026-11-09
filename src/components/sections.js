import { h } from "../lib/dom.js";
import { data, setData } from "../store.js";
import { sections } from "../selectors.js";
import { ProductRow } from "./product.js";
import { Banner, Spinner } from "./common.js";

export function ProductsTable(items, withHead = true, action = null) {
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
              action ? h("th", { class: "row-action" }) : null
            )
          )
        : null,
      h("tbody", null, items.map((item) => ProductRow(item, action)))
    )
  );
}

function ProductsBlock(items) {
  return ProductsTable(items);
}

function ExtrasBlock(extras) {
  return h(
    "div",
    { class: "extras" },
    h("div", { class: "extras-head" }, `Není v oblíbených, ale je v košíku (${extras.length})`),
    ProductsTable(extras, false)
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

function FilterToggle() {
  const current = data.favoritesFilter || "remaining";
  const option = (value, label) =>
    h(
      "button",
      {
        class: `filter-btn${current === value ? " active" : ""}`,
        type: "button",
        onClick: () => setData({ favoritesFilter: value }),
      },
      label
    );
  return h("div", { class: "filter-switch" }, option("all", "Všechny"), option("remaining", "Zbylé"));
}

function SectionsContent() {
  const groups = sections();
  if (data.loadingFavorites && data.favorites.length === 0) {
    return h("div", { class: "card loading-block" }, Spinner(true), "Načítám oblíbené…");
  }
  if (data.status === "error") {
    return h("div", { class: "card pad" }, Banner("error", data.error));
  }
  if (groups.length === 0) {
    const message =
      data.favoritesFilter === "remaining" && data.favorites.length > 0
        ? "Všechny oblíbené už jsou přiřazené v nákupním seznamu."
        : "Zatím tu nejsou žádné oblíbené položky ani položky v košíku.";
    return h("div", { class: "card pad empty" }, message);
  }
  return h("div", { class: "stack" }, groups.map(CategorySection));
}

export function Sections() {
  return h("div", { class: "stack" }, FilterToggle(), SectionsContent());
}
