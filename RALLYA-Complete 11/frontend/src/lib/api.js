import seedEvents from "../../../backend/data/events.json";
import seedResorts from "../../../backend/data/resorts.json";

const API = import.meta.env.VITE_API_URL || "/api";
const CUSTOM_KEY = "rallya-custom-events";
const SUBS_KEY = "rallya-subscribers";
const TOKEN_KEY = "rallya-token";
const DEMO_USERS_KEY = "rallya-demo-users";

let demo = false;
export const isDemo = () => demo;

const readLS = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
const writeLS = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const type = res.headers.get("content-type") || "";
  if (!type.includes("json")) throw new Error("API unavailable");
  const body = await res.json();
  if (!res.ok) { const err = new Error(body.error || `Request failed (${res.status})`); err.validation = true; err.status = res.status; throw err; }
  return body;
}

const validationError = (message, status = 400) => Object.assign(new Error(message), { validation: true, status });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- events / resorts ---------- */
/** Loads events from the API; if the backend isn't running, falls back to bundled sample data ("demo mode"). */
export async function fetchEvents() {
  try { const data = await request("/events"); demo = false; return data; }
  catch { demo = true; return [...seedEvents, ...readLS(CUSTOM_KEY, [])]; }
}
export async function fetchResorts() {
  try { return await request("/resorts"); } catch { return seedResorts; }
}
export async function fetchConfig() {
  try { return await request("/config"); } catch { return { auth: true, liveEvents: false }; }
}
/** Live events from Ticketmaster (only when the backend has TICKETMASTER_KEY). */
export async function fetchLive() {
  try { return await request("/live/all"); } catch {
    try { return await request("/live/redbull"); } catch { return []; }
  }
}
/** IDs of events the signed-in user created (they're the only ones allowed to delete them). */
export async function fetchMine() {
  if (demo) return readLS(CUSTOM_KEY, []).map((e) => e.id);
  try { return await request("/events/mine"); } catch { return []; }
}

export async function createEvent(payload) {
  if (!demo) return request("/events", { method: "POST", body: JSON.stringify(payload) });
  if (!getToken()) throw validationError("Please sign in to add events", 401);
  const tags = Array.isArray(payload.tags) ? payload.tags : [];
  const event = { ...payload, tags, id: `evt-${Date.now().toString(36)}`, featured: false, custom: true, location: payload.location || `${payload.city}, France` };
  writeLS(CUSTOM_KEY, [...readLS(CUSTOM_KEY, []), event]);
  return event;
}
export async function removeEvent(id) {
  if (!demo) return request(`/events/${id}`, { method: "DELETE" });
  writeLS(CUSTOM_KEY, readLS(CUSTOM_KEY, []).filter((e) => e.id !== id));
  return { ok: true };
}

export async function subscribe(email) {
  if (!demo) return request("/subscribe", { method: "POST", body: JSON.stringify({ email }) });
  if (!EMAIL_RE.test(email)) throw validationError("Please enter a valid email address");
  const subs = readLS(SUBS_KEY, []);
  if (!subs.includes(email)) writeLS(SUBS_KEY, [...subs, email]);
  return { ok: true };
}
export async function reserve(eventId) {
  if (!demo) return request("/reservations", { method: "POST", body: JSON.stringify({ eventId }) });
  return { ok: true };
}

/* ---------- accounts ---------- */
// With the backend running, accounts live on the server (scrypt-hashed passwords, signed tokens).
// In demo mode (no backend) they live in this browser only, so it's just for trying out the flow.
async function pbkdf2(password, saltHex) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const randomHex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n))).map((b) => b.toString(16).padStart(2, "0")).join("");
const demoPublic = (u) => ({ id: u.id, name: u.name, email: u.email, saved: u.saved || [] });

export const auth = {
  async register({ name, email, password }) {
    email = email.trim().toLowerCase();
    if (!demo) { const r = await request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }); setToken(r.token); return r.user; }
    if (!name.trim()) throw validationError("Please enter your name");
    if (!EMAIL_RE.test(email)) throw validationError("Please enter a valid email address");
    if (password.length < 8) throw validationError("Password must be at least 8 characters");
    const users = readLS(DEMO_USERS_KEY, []);
    if (users.some((u) => u.email === email)) throw validationError("An account with that email already exists. Try signing in.", 409);
    const salt = randomHex(16);
    const user = { id: `usr-${randomHex(4)}`, name: name.trim(), email, salt, hash: await pbkdf2(password, salt), saved: [] };
    writeLS(DEMO_USERS_KEY, [...users, user]);
    setToken(`demo:${user.id}`);
    return demoPublic(user);
  },
  async login({ email, password }) {
    email = email.trim().toLowerCase();
    if (!demo) { const r = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); setToken(r.token); return r.user; }
    const user = readLS(DEMO_USERS_KEY, []).find((u) => u.email === email);
    if (!user || (await pbkdf2(password, user.salt)) !== user.hash) throw validationError("Incorrect email or password", 401);
    setToken(`demo:${user.id}`);
    return demoPublic(user);
  },
  /** Restores the session on page load; returns null if not signed in / token expired. */
  async me() {
    const token = getToken();
    if (!token) return null;
    if (demo) { const u = readLS(DEMO_USERS_KEY, []).find((x) => `demo:${x.id}` === token); return u ? demoPublic(u) : null; }
    try { return (await request("/auth/me")).user; } catch (e) { if (e.status === 401) setToken(""); return null; }
  },
  logout() { setToken(""); },
  async saveSaved(saved) {
    if (!getToken()) return;
    if (demo) {
      const id = getToken().replace("demo:", "");
      writeLS(DEMO_USERS_KEY, readLS(DEMO_USERS_KEY, []).map((u) => (u.id === id ? { ...u, saved } : u)));
      return;
    }
    await request("/me/saved", { method: "PUT", body: JSON.stringify({ saved }) });
  },
};
