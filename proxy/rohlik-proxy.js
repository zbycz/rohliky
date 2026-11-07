const BASE = "https://www.rohlik.cz";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept,X-Session",
    "Access-Control-Expose-Headers": "X-Session",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function readSetCookie(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie().join(", ");
  return headers.get("Set-Cookie");
}

function sessionFromSetCookie(header) {
  if (!header) return null;
  const match = header.match(/PHPSESSION=([^;,\s]+)/i);
  return match ? match[1] : null;
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const target = BASE + url.pathname + url.search;
    const headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("Accept-Language", "cs-CZ,cs;q=0.9,en;q=0.8");
    headers.set("User-Agent", "rohliky-favorites/1.0 (+https://github.com/zbycz/rohliky)");
    headers.set("Origin", BASE);
    headers.set("Referer", BASE + "/");
    const contentType = request.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);
    const session = request.headers.get("X-Session");
    if (session) headers.set("Cookie", `PHPSESSION=${session}`);

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers(cors);
    const upstreamType = upstream.headers.get("Content-Type");
    if (upstreamType) responseHeaders.set("Content-Type", upstreamType);
    const newSession = sessionFromSetCookie(readSetCookie(upstream.headers));
    if (newSession) responseHeaders.set("X-Session", newSession);

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  },
};
