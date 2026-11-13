// Our Family Day - Cloudflare Worker
// The page itself lives in /public and is served as static assets.
// This Worker answers /api/* and stores the routine and each day's ticks in Workers KV.
// Bindings: ROUTINE (KV namespace), ASSETS (static files). Optional secret FAMILY_PIN.

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);

    if (env.FAMILY_PIN && req.headers.get("x-family-pin") !== env.FAMILY_PIN) return json({ error: "pin" }, 401);
    if (!env.ROUTINE) return json({ error: "KV binding ROUTINE is missing" }, 500);

    if (url.pathname === "/api/plan") {
      if (req.method === "GET") return json(await env.ROUTINE.get("plan", "json"));
      if (req.method === "PUT") {
        const body = await req.json().catch(() => null);
        if (!body || typeof body.plan !== "object") return json({ error: "bad plan" }, 400);
        const doc = { plan: body.plan, updatedAt: Date.now() };
        await env.ROUTINE.put("plan", JSON.stringify(doc));
        return json({ ok: true, updatedAt: doc.updatedAt });
      }
    }

    const m = url.pathname.match(/^\/api\/ticks\/(\d{4}-\d{2}-\d{2})$/);
    if (m) {
      const key = "ticks:" + m[1];
      const keep = { expirationTtl: 60 * 60 * 24 * 30 }; // old days clean themselves up after 30 days
      if (req.method === "GET") return json((await env.ROUTINE.get(key, "json")) || { done: {} });
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (typeof body.id !== "string" || body.id.length > 40) return json({ error: "bad id" }, 400);
        const cur = (await env.ROUTINE.get(key, "json")) || { done: {} };
        if (body.on) cur.done[body.id] = true; else delete cur.done[body.id];
        await env.ROUTINE.put(key, JSON.stringify(cur), keep);
        return json(cur);
      }
      if (req.method === "PUT") {
        await env.ROUTINE.put(key, JSON.stringify({ done: {} }), keep);
        return json({ done: {} });
      }
    }
    return json({ error: "not found" }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
