// Lumo Proxy: lets Lumo read addons that do not allow web apps (CORS).
// Only your own Lumo site can use it, and only with your passphrase.
// Environment variables:
//   PROXY_KEY       (required) a long secret passphrase you make up (32+ characters)
//   ALLOWED_ORIGIN  (required) your Lumo address, e.g. https://https-lumo.onrender.com
//                   (several can be separated by commas)
const http = require("http");
const https = require("https");
const dns = require("dns");
const net = require("net");
const crypto = require("crypto");

const KEY = process.env.PROXY_KEY || "";
const ORIGINS = (process.env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
const PORT = process.env.PORT || 8080;
const MAX_BYTES = 5 * 1024 * 1024; // addon answers are small JSON; this is only a safety cap
const LIMIT_PER_MIN = 300;

// ---- Safety: never let the proxy reach private or internal addresses
function isPrivate(ip) {
  ip = String(ip).toLowerCase();
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0);
  }
  if (net.isIPv6(ip)) {
    return ip === "::" || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe8") ||
      ip.startsWith("fe9") || ip.startsWith("fea") || ip.startsWith("feb") || ip.startsWith("ff");
  }
  return true;
}
function safeLookup(host, opts, cb) {
  dns.lookup(host, opts, (err, addr, fam) => {
    if (err) return cb(err);
    const list = Array.isArray(addr) ? addr : [{ address: addr, family: fam }];
    for (const a of list) if (isPrivate(a.address)) return cb(new Error("blocked address"));
    cb(null, addr, fam);
  });
}

function get(target, hops = 0) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(target); } catch { return reject(new Error("bad url")); }
    if (!["http:", "https:"].includes(url.protocol)) return reject(new Error("bad protocol"));
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && isPrivate(host)) return reject(new Error("blocked address"));
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(url, {
      method: "GET",
      headers: { "user-agent": "Lumo-Proxy/1.0", accept: "application/json,*/*" },
      lookup: safeLookup,
      timeout: 15000
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (hops >= 5) return reject(new Error("too many redirects"));
        return resolve(get(new URL(res.headers.location, url).toString(), hops + 1));
      }
      const chunks = []; let n = 0;
      res.on("data", d => { n += d.length; if (n > MAX_BYTES) { req.destroy(); return reject(new Error("too large")); } chunks.push(d); });
      res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"] || "application/octet-stream", body: Buffer.concat(chunks) }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

const sha = s => crypto.createHash("sha256").update(String(s)).digest();
const keyOk = given => KEY.length > 0 && crypto.timingSafeEqual(sha(given), sha(KEY));

const hits = new Map();
const limited = ip => {
  const now = Date.now(), h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h);
  return h.n > LIMIT_PER_MIN;
};

http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  const okOrigin = ORIGINS.includes(origin);
  const cors = { Vary: "Origin" };
  if (okOrigin) {
    cors["Access-Control-Allow-Origin"] = origin;
    cors["Access-Control-Allow-Headers"] = "x-lumo-key";
    cors["Access-Control-Allow-Methods"] = "GET,OPTIONS";
    cors["Access-Control-Max-Age"] = "86400";
  }
  const json = (code, body) => { res.writeHead(code, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };

  if (req.method === "OPTIONS") { res.writeHead(okOrigin ? 204 : 403, cors); return res.end(); }
  const u = new URL(req.url, "http://x");

  if (u.pathname === "/health") return json(200, { ok: true, ready: KEY.length >= 16 && ORIGINS.length > 0 });
  if (u.pathname === "/") { res.writeHead(200, { "Content-Type": "text/plain" }); return res.end("Lumo Proxy is running."); }

  if (u.pathname === "/fetch") {
    if (req.method !== "GET") return json(405, { error: "GET only" });
    if (!okOrigin) return json(403, { error: "origin not allowed" });
    if (!keyOk(req.headers["x-lumo-key"] || "")) return json(401, { error: "bad key" });
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    if (limited(ip)) return json(429, { error: "slow down" });
    try {
      const r = await get(u.searchParams.get("u") || "");
      res.writeHead(r.status, { ...cors, "Content-Type": r.type, "Cache-Control": "no-store" });
      return res.end(r.body);
    } catch (e) {
      return json(502, { error: "upstream failed" }); // the target address is never logged
    }
  }
  return json(404, { error: "not found" });
}).listen(PORT, () => console.log(`Lumo Proxy listening on ${PORT}; key ${KEY ? "set" : "MISSING"}; origins ${ORIGINS.length}`));
