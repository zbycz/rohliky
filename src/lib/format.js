export function money(value, currency = "Kč") {
  if (value == null || Number.isNaN(Number(value))) return "";
  return `${Math.round(Number(value)).toLocaleString("cs-CZ")} ${currency}`;
}

export function unitPrice(price, unit) {
  return `${money(price)} / ${unit || "ks"}`;
}

export function availability(stock) {
  if (!stock) return { tone: "muted", label: "Neznámá dostupnost", orderable: false };
  const status = stock.availabilityStatus;
  if (status === "AVAILABLE") {
    const limited = stock.maxAvailableAmount != null && stock.maxAvailableAmount <= 5;
    return limited
      ? { tone: "warn", label: `Posledních ${stock.maxAvailableAmount} ks`, orderable: true }
      : { tone: "ok", label: "Skladem", orderable: true };
  }
  const orderable = status === "PREORDER";
  if (stock.availabilityReason) {
    return { tone: orderable ? "warn" : "muted", label: stock.availabilityReason, orderable };
  }
  return { tone: "muted", label: "Není skladem", orderable: false };
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
