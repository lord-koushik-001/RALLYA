import { cacheGet, cacheSet, fetchJSON } from "./cache.js";

// Places are fetched through the RALLYA backend so browser CORS restrictions do
// not break the restaurant/map experience. Data comes from OpenStreetMap.
export const PLACE_TYPES = {
  restaurant: { label: "Restaurants", art: "food" },
  cafe: { label: "Cafés", art: "food" },
  bar: { label: "Bars & nightlife", art: "bar" },
  stay: { label: "Places to stay", art: "stay" },
};
const API = import.meta.env.VITE_API_URL || "/api";
const TTL = 6 * 60 * 60 * 1000;

export async function searchPlaces(lat, lng, type = "restaurant", radius = 1500) {
  const key = `places:${type}:${lat.toFixed(3)},${lng.toFixed(3)}:${radius}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const data = await fetchJSON(`${API}/places?type=${encodeURIComponent(type)}&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}`, {}, 30000);
  cacheSet(key, data, TTL);
  return data;
}

export async function geocode(query) {
  const key = `geo:${query.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const data = await fetchJSON(`${API}/geocode?q=${encodeURIComponent(query)}`, {}, 15000);
  cacheSet(key, data, 30 * 24 * 60 * 60 * 1000);
  return data;
}

export const directionsUrl = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
