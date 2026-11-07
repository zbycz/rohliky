export function money(value, currency = "Kč") {
  if (value == null || Number.isNaN(Number(value))) return "";
  return `${Number(value).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function unitPrice(price, unit) {
  return `${money(price)} / ${unit || "ks"}`;
}

export function availability(stock) {
  if (!stock) return { tone: "muted", label: "Neznámá dostupnost" };
  const status = stock.availabilityStatus;
  if (status === "AVAILABLE") {
    const limited = stock.maxAvailableAmount != null && stock.maxAvailableAmount <= 5;
    return limited
      ? { tone: "warn", label: `Posledních ${stock.maxAvailableAmount} ks` }
      : { tone: "ok", label: "Skladem" };
  }
  if (status === "OUT_OF_STOCK" || status === "NOT_AVAILABLE") {
    return { tone: "muted", label: "Není skladem" };
  }
  return { tone: "warn", label: "Omezeně dostupné" };
}

export function cardPrice(card) {
  const prices = card.prices || {};
  const finalPrice = prices.salePrice != null ? prices.salePrice : prices.originalPrice;
  return {
    final: finalPrice,
    original: prices.originalPrice,
    onSale: prices.salePrice != null && prices.originalPrice != null && prices.salePrice < prices.originalPrice,
    unit: prices.unitPrice,
    currency: prices.currency === "CZK" ? "Kč" : prices.currency || "Kč",
  };
}

export function cartQuantity(cart, productId) {
  const item = cart && cart.items ? cart.items[String(productId)] : null;
  return item ? item.quantity : 0;
}

export function cartCount(cart) {
  if (!cart || !cart.items) return 0;
  return Object.values(cart.items).reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function normalizeText(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
