import { config, setConfig } from "./store.js";

let seq = 0;

function newId() {
  seq += 1;
  return `s${Date.now().toString(36)}-${seq}`;
}

export function items() {
  return config.shopping || [];
}

function itemsExcept(id) {
  return items().filter((item) => item.id !== id);
}

export function indexOf(id) {
  return items().findIndex((item) => item.id === id);
}

export function newItem(text = "") {
  return { id: newId(), text, done: false, open: false, products: [] };
}

export function insert(index, item) {
  const list = [...items()];
  const at = Math.max(0, Math.min(index, list.length));
  list.splice(at, 0, item);
  setConfig({ shopping: list });
  return item;
}

export function add(index, text = "") {
  return insert(index, newItem(text));
}

export function setText(id, text) {
  setConfig({ shopping: items().map((item) => (item.id === id ? { ...item, text } : item)) });
}

export function toggle(id) {
  setConfig({ shopping: items().map((item) => (item.id === id ? { ...item, done: !item.done } : item)) });
}

export function remove(id) {
  setConfig({ shopping: itemsExcept(id) });
}

export function move(id, delta) {
  const list = [...items()];
  const from = list.findIndex((item) => item.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  setConfig({ shopping: list });
}

export function toggleOpen(id) {
  setConfig({ shopping: items().map((item) => (item.id === id ? { ...item, open: !item.open } : item)) });
}

export function addProduct(id, productId) {
  const key = String(productId);
  setConfig({
    shopping: items().map((item) =>
      item.id === id && !item.products.includes(key) ? { ...item, products: [...item.products, key] } : item
    ),
  });
}
