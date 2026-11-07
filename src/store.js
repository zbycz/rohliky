const STORAGE_KEY = "rohliky";

function defaults() {
  return {
    version: 1,
    session: "",
    view: "grid",
    address: { query: "Ke Džbánu 8, Praha 6", currentId: null },
    auth: { email: "", remember: false, password: "", userId: null, name: "" },
    categories: {},
  };
}

function merge(base, patch) {
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      out[key] = merge(base[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return stored ? merge(defaults(), stored) : defaults();
  } catch {
    return defaults();
  }
}

export const config = load();

export const data = {
  status: "idle",
  error: null,
  favorites: [],
  cart: null,
  addresses: [],
  busy: {},
  cartOpen: false,
  settingsOpen: false,
  toasts: [],
  loadingFavorites: false,
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify() {
  for (const listener of listeners) listener();
}

export function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    null;
  }
}

export function setConfig(patch) {
  Object.assign(config, patch);
  saveConfig();
  notify();
}

export function setData(patch) {
  Object.assign(data, patch);
  notify();
}

export function toast(message, tone = "info") {
  const id = Math.random().toString(36).slice(2);
  data.toasts = [...data.toasts, { id, message, tone }];
  notify();
  setTimeout(() => {
    data.toasts = data.toasts.filter((item) => item.id !== id);
    notify();
  }, 3500);
}
