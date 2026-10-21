/**
 * Vulture5x Cloudflare Worker.
 * Static site is served by the Cloudflare Workers Static Assets binding.
 * Twitch metrics use same-origin /api/twitch/... routes.
 */
const USERNAME_RE = /^[a-zA-Z0-9_]{1,25}$/;
const STATS = new Set(["followcount", "viewercount", "uptime"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/twitch/")) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      return twitchApi(url);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD", "X-Content-Type-Options": "nosniff" }
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (url.pathname === "/" || url.pathname.endsWith(".html")) {
      headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    }
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers
    });
  }
};

async function twitchApi(url) {
  const parts = url.pathname.split("/").filter(Boolean);
  // /api/twitch/{followcount|viewercount|uptime|summary}/{channel}
  if (parts.length !== 4 || parts[0] !== "api" || parts[1] !== "twitch") {
    return json({ error: "Not found" }, 404);
  }

  const kind = parts[2];
  const login = parts[3];
  if (!USERNAME_RE.test(login)) return json({ error: "Invalid Twitch channel name" }, 400);

  let upstream;
  let contentType;
  if (STATS.has(kind)) {
    upstream = `https://decapi.me/twitch/${kind}/${encodeURIComponent(login)}`;
    contentType = "text/plain; charset=utf-8";
  } else if (kind === "summary") {
    upstream = `https://twitchtracker.com/api/channels/summary/${encodeURIComponent(login)}`;
    contentType = "application/json; charset=utf-8";
  } else {
    return json({ error: "Not found" }, 404);
  }

  try {
    const response = await fetch(upstream, {
      headers: { Accept: kind === "summary" ? "application/json" : "text/plain" },
      redirect: "follow"
    });
    if (!response.ok) {
      return new Response(kind === "summary" ? "{}" : "", {
        status: 502,
        headers: { "Content-Type": contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
      });
    }
    const body = await response.text();
    // Guard against a third-party endpoint returning an HTML error page as JSON.
    if (kind === "summary") {
      try { JSON.parse(body); } catch {
        return new Response("{}", { headers: { "Content-Type": contentType, "Cache-Control": "no-store" } });
      }
    }
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return new Response(kind === "summary" ? "{}" : "", {
      status: 502,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" }
    });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
