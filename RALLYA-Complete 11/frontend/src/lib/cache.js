// Tiny cache: in-memory + localStorage with an expiry, so free public APIs aren't hit repeatedly.
const mem = new Map();
export function cacheGet(key) {
  const hit = mem.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  try {
    const raw = JSON.parse(localStorage.getItem(`rc:${key}`) || "null");
    if (raw && raw.exp > Date.now()) { mem.set(key, raw); return raw.value; }
  } catch { /* ignore */ }
  return undefined;
}
export function cacheSet(key, value, ttlMs) {
  const entry = { value, exp: Date.now() + ttlMs };
  mem.set(key, entry);
  try { localStorage.setItem(`rc:${key}`, JSON.stringify(entry)); } catch { /* storage full/unavailable */ }
}

export async function fetchJSON(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}
