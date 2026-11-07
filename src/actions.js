import * as api from "./api/rohlik.js";
import { config, data, saveConfig, setConfig, setData, toast } from "./store.js";

const CATEGORY_CONCURRENCY = 6;

export function hasAccount() {
  return Boolean(config.session) || Boolean(config.auth.userId);
}

async function ensureCategories(cards) {
  const missing = cards.filter((card) => !config.categories[card.productId]);
  let cursor = 0;
  async function worker() {
    while (cursor < missing.length) {
      const card = missing[cursor];
      cursor += 1;
      try {
        const category = await api.getProductCategory(card.productId);
        if (category) {
          config.categories[card.productId] = { id: category.id, name: category.name, slug: category.slug };
        }
      } catch {
        null;
      }
    }
  }
  const workers = Array.from({ length: Math.min(CATEGORY_CONCURRENCY, missing.length) }, worker);
  await Promise.all(workers);
  if (missing.length) saveConfig();
}

export async function loadCart() {
  const cart = await api.getCart();
  setData({ cart: cart || { items: {}, totalPrice: 0 } });
}

export async function loadAddresses() {
  try {
    const addresses = await api.getAddresses();
    const list = Array.isArray(addresses) ? addresses : [];
    setData({ addresses: list });
    const current = list.find((entry) => entry.address && entry.address.isDeliveredTo) || list[0];
    if (current && current.address) {
      setConfig({ address: { ...config.address, currentId: current.address.id } });
    }
  } catch {
    setData({ addresses: [] });
  }
}

export async function loadFavorites() {
  setData({ loadingFavorites: true });
  try {
    const ids = await api.getFavoriteIds();
    const cards = await api.getProductCards(ids, "favorite");
    await ensureCategories(cards);
    setData({ favorites: cards, loadingFavorites: false });
  } catch (error) {
    setData({ loadingFavorites: false });
    throw error;
  }
}

export async function refresh() {
  if (!hasAccount()) return;
  setData({ status: "loading", error: null });
  try {
    await Promise.all([loadFavorites(), loadCart(), loadAddresses()]);
    setData({ status: "ready" });
  } catch (error) {
    setData({ status: "error", error: error.message });
  }
}

export async function login(email, password, remember) {
  setData({ status: "loading", error: null });
  try {
    const payload = await api.login(email, password);
    const userData = (payload && payload.data) || {};
    const user = userData.user || {};
    const address = userData.address || {};
    setConfig({
      auth: {
        email,
        remember,
        password: remember ? password : "",
        userId: user.id || config.auth.userId,
        name: user.name || "",
      },
    });
    if (address.id) setConfig({ address: { ...config.address, currentId: address.id } });
    setData({ status: "ready" });
    await refresh();
    toast("Přihlášeno do Rohlík.cz");
  } catch (error) {
    setData({ status: "error", error: error.message });
  }
}

export async function logout() {
  await api.logout();
  setConfig({ auth: { email: config.auth.email, remember: config.auth.remember, password: config.auth.password, userId: null, name: "" }, session: "" });
  setData({ favorites: [], cart: null, addresses: [], status: "idle", error: null });
}

export async function setQuantity(productId, quantity, orderFieldId) {
  setData({ busy: { ...data.busy, [productId]: true } });
  try {
    if (quantity <= 0) {
      if (orderFieldId) await api.removeCartItem(orderFieldId);
    } else if (orderFieldId) {
      await api.updateCartItem(orderFieldId, quantity);
    } else {
      await api.addToCart(productId, quantity);
    }
    await loadCart();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setData({ busy: { ...data.busy, [productId]: false } });
  }
}

export function changeQuantity(item, delta) {
  const next = Math.max(0, item.quantity + delta);
  setQuantity(item.id, next, item.orderFieldId);
}

export async function markFavorite(productId) {
  try {
    await api.setFavorite(productId, true);
    toast("Přidáno do oblíbených");
    await loadFavorites();
  } catch (error) {
    toast(error.message, "error");
  }
}

export async function removeFavorite(productId) {
  try {
    await api.setFavorite(productId, false);
    toast("Odebráno z oblíbených");
    await loadFavorites();
  } catch (error) {
    toast(error.message, "error");
  }
}

export async function selectAddress(address) {
  try {
    await api.setDeliveryAddress(address);
    setConfig({ address: { ...config.address, currentId: address.id } });
    toast("Doručovací adresa nastavena");
    await Promise.all([loadFavorites(), loadCart()]);
  } catch (error) {
    toast(error.message, "error");
  }
}
