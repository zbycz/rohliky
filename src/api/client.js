import { config, setConfig } from "../store.js";

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const PROXY_PATH = "/rohlik";

function resolveUrl(path) {
  return `${PROXY_PATH}${path}`;
}

function extractMessage(payload, status) {
  if (payload && Array.isArray(payload.messages) && payload.messages[0] && payload.messages[0].content) {
    return payload.messages[0].content;
  }
  if (payload && typeof payload.message === "string") return payload.message;
  return `Chyba požadavku (HTTP ${status})`;
}

export async function request(path, options = {}) {
  const { method = "GET", body, signal } = options;
  const headers = { Accept: "application/json" };
  if (config.session) headers["X-Session"] = config.session;
  let payloadBody;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payloadBody = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(resolveUrl(path), {
      method,
      headers,
      body: payloadBody,
      credentials: "include",
      signal,
    });
  } catch (error) {
    throw new ApiError(`Nepodařilo se připojit k Rohlik.cz. ${error.message}`, 0, null);
  }
  const returnedSession = response.headers.get("X-Session");
  if (returnedSession && returnedSession !== config.session) setConfig({ session: returnedSession });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  const bodyStatus = payload && typeof payload === "object" ? payload.status : null;
  if (!response.ok || (bodyStatus && bodyStatus >= 400)) {
    throw new ApiError(extractMessage(payload, response.status), response.status, payload);
  }
  return payload;
}

export function unwrap(payload) {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}
