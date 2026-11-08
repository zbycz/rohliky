import { config, data } from "./store.js";
import { availability, cardPrice } from "./lib/format.js";

const IMAGE_CDN = "https://cdn.rohlik.cz";
const PRODUCT_URL = "https://www.rohlik.cz";

function imageUrl(path) {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${IMAGE_CDN}${path}`;
}

function productUrl(productId, slug) {
  if (!productId) return "";
  if (!slug) return `${PRODUCT_URL}/${productId}`;
  const tail = slug.startsWith(`${productId}-`) ? slug : `${productId}-${slug}`;
  return `${PRODUCT_URL}/${tail}`;
}

function fallbackCategoryName() {
  return "Ostatní";
}

function categoryNameFor(productId) {
  const category = config.categories[productId];
  return category && category.name ? category.name : fallbackCategoryName();
}

export function favoriteToView(card) {
  return {
    id: card.productId,
    name: card.name,
    url: productUrl(card.productId, card.slug),
    image: imageUrl(card.image && card.image.path),
    amount: card.textualAmount || "",
    unit: card.unit || "",
    price: cardPrice(card),
    availability: availability(card.stock),
    isFavorite: true,
    maxAmount: card.stock ? card.stock.maxAvailableAmount : null,
  };
}

export function cartItemToView(item) {
  return {
    id: item.productId,
    orderFieldId: item.orderFieldId,
    quantity: item.quantity,
    name: item.productName,
    url: productUrl(item.productId, item.baseLink),
    image: imageUrl(item.imgPath),
    amount: item.textualAmount || "",
    unit: item.unit || "",
    price: { final: item.price, original: null, onSale: false, unit: item.originalPricePerUnit, currency: "Kč" },
    availability: { tone: "ok", label: "V košíku", orderable: true },
    isFavorite: false,
    categoryName: item.primaryCategoryName || null,
  };
}

export function cartItems() {
  const cart = data.cart;
  if (!cart || !cart.items) return [];
  return Object.values(cart.items).map(cartItemToView);
}

export function favoriteIds() {
  return new Set(data.favorites.map((card) => card.productId));
}

export function favoriteView(productId) {
  const card = data.favorites.find((favorite) => String(favorite.productId) === String(productId));
  return card ? favoriteToView(card) : null;
}

export function sections() {
  const favorites = data.favorites.map(favoriteToView);
  const inCart = cartItems();
  const favoriteSet = favoriteIds();
  const grouped = new Map();

  for (const product of favorites) {
    const name = categoryNameFor(product.id);
    if (!grouped.has(name)) grouped.set(name, { name, items: [], extras: [] });
    grouped.get(name).items.push(product);
  }

  const leftovers = [];
  for (const item of inCart) {
    if (favoriteSet.has(item.id)) continue;
    const name = item.categoryName || categoryNameFor(item.id);
    if (grouped.has(name)) {
      grouped.get(name).extras.push(item);
    } else {
      leftovers.push({ name, item });
    }
  }

  for (const entry of leftovers) {
    if (!grouped.has(entry.name)) grouped.set(entry.name, { name: entry.name, items: [], extras: [] });
    grouped.get(entry.name).extras.push(entry.item);
  }

  return Array.from(grouped.values())
    .filter((group) => group.items.length > 0 || group.extras.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "cs"));
}
