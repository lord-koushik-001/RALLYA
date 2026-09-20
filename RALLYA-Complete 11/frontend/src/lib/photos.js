import { useEffect, useState } from "react";
import { cacheGet, cacheSet, fetchJSON } from "./cache.js";

// Real photos of places come from Wikipedia's free REST API (no key needed).
// Images are credited to Wikipedia; licences are listed on each article's image page.
const ALIASES = { "Chamonix-Mont-Blanc": "Chamonix" };
const inflight = new Map();
const DAY = 24 * 60 * 60 * 1000;

export async function getPlacePhoto(name) {
  if (!name) return null;
  const title = (ALIASES[name] || name).replace(/\s+/g, "_");
  const key = `photo:${title}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const data = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { Accept: "application/json" } }, 10000);
      const src = data.thumbnail?.source;
      const photo = src ? { url: src.replace(/\/\d+px-/, "/960px-"), fallback: src, page: data.content_urls?.desktop?.page || "https://en.wikipedia.org", title: data.title } : null;
      cacheSet(key, photo, photo ? 7 * DAY : DAY);
      return photo;
    } catch { return null; }
    finally { inflight.delete(key); }
  })();
  inflight.set(key, p);
  return p;
}

export function usePlacePhoto(name, enabled = true) {
  const [photo, setPhoto] = useState(() => (enabled && name ? cacheGet(`photo:${(ALIASES[name] || name).replace(/\s+/g, "_")}`) || null : null));
  useEffect(() => {
    let live = true;
    if (!enabled || !name) { setPhoto(null); return undefined; }
    getPlacePhoto(name).then((p) => { if (live) setPhoto(p); });
    return () => { live = false; };
  }, [name, enabled]);
  return photo;
}
