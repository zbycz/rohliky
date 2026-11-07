import { request, unwrap } from "./client.js";

const CARD_CHUNK = 50;
const FAVORITE_PAGE_SIZE = 50;
const MAX_FAVORITE_PAGES = 40;

export function login(email, password) {
  return request("/services/frontend-service/login", {
    method: "POST",
    body: { email, password, name: "" },
  });
}

export async function logout() {
  try {
    await request("/services/frontend-service/logout", { method: "POST" });
  } catch {
    null;
  }
}

export async function getCart() {
  return unwrap(await request("/services/frontend-service/v2/cart"));
}

export async function addToCart(productId, quantity = 1) {
  const path = `/services/frontend-service/v2/cart?productId=${encodeURIComponent(productId)}`;
  return unwrap(
    await request(path, {
      method: "POST",
      body: { productId, quantity, actionId: null, recipeId: null, source: "true:Shopping Lists" },
    })
  );
}

export async function updateCartItem(orderFieldId, quantity) {
  const path = `/services/frontend-service/v2/cart?orderFieldId=${encodeURIComponent(orderFieldId)}`;
  return unwrap(await request(path, { method: "PUT", body: { orderFieldId, quantity } }));
}

export async function removeCartItem(orderFieldId) {
  const path = `/services/frontend-service/v2/cart?orderFieldId=${encodeURIComponent(orderFieldId)}`;
  return unwrap(await request(path, { method: "DELETE" }));
}

export function setFavorite(productId, favourite) {
  return request("/services/frontend-service/product/favourite", {
    method: "POST",
    body: { productId, favourite },
  });
}

export async function getFavoriteIds() {
  const ids = [];
  for (let page = 0; page < MAX_FAVORITE_PAGES; page += 1) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(FAVORITE_PAGE_SIZE),
      sort: "recommended",
      filter: "",
      excludeProductIds: "",
    });
    const payload = await request(`/api/v1/categories/favorite/products?${params}`);
    const batch = (payload && payload.productIds) || [];
    ids.push(...batch);
    if (batch.length < FAVORITE_PAGE_SIZE) break;
  }
  return ids;
}

export async function getProductCards(ids, categoryType = "favorite") {
  const cards = [];
  for (let index = 0; index < ids.length; index += CARD_CHUNK) {
    const params = new URLSearchParams();
    for (const id of ids.slice(index, index + CARD_CHUNK)) params.append("products", String(id));
    params.append("categoryType", categoryType);
    const payload = await request(`/api/v1/products/card?${params}`);
    if (Array.isArray(payload)) cards.push(...payload);
  }
  return cards;
}

export async function getProductCategory(productId) {
  const payload = await request(`/api/v1/products/${encodeURIComponent(productId)}/categories`);
  const list = (payload && payload.categories) || [];
  return list[0] || null;
}

export async function getAddresses() {
  return unwrap(await request("/services/frontend-service/delivery-address/list")) || [];
}

export async function setDeliveryAddress(address) {
  return unwrap(
    await request("/services/frontend-service/delivery-zone/set", {
      method: "POST",
      body: {
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
        latitude: address.latitude,
        longitude: address.longitude,
        location: address.location,
        fullAddress: address.fullAddress,
      },
    })
  );
}

export async function getProductDeliveryInfo(productId) {
  return unwrap(await request(`/api/v1/products/${encodeURIComponent(productId)}/delivery-info/json`));
}
