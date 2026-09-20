import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const FILES = {
  events: path.join(DATA_DIR, "events.json"),
  resorts: path.join(DATA_DIR, "resorts.json"),
  subscribers: path.join(DATA_DIR, "subscribers.json"),
  reservations: path.join(DATA_DIR, "reservations.json"),
  users: path.join(DATA_DIR, "users.json"),
  secret: path.join(DATA_DIR, ".jwt-secret"),
};
const DIST_DIR = path.join(__dirname, "..", "frontend", "dist");
const PORT = process.env.PORT || 5001;
const TM_KEY = process.env.TICKETMASTER_KEY || "";

const CATEGORIES = ["Sports", "Adventure", "Travel", "DJ & Music", "Culture"];
const REGIONS = ["Alps", "Paris", "Lyon", "Riviera", "Provence", "Other"];
const KINDS = ["snow", "dj", "culture", "travel", "sea", "city", "adventure"];
const KIND_BY_CATEGORY = { Sports: "city", Adventure: "adventure", Travel: "travel", "DJ & Music": "dj", Culture: "culture" };

/* ---------- storage helpers ---------- */
function readJSON(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function writeJSON(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

/* ---------- validation helpers ---------- */
const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));
const isTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const isUrl = (v) => { try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } };
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
const num = (v, min, max) => { const n = typeof v === "string" && v.trim() === "" ? NaN : Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
const list = (v, max, len) => {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\n,]/) : [];
  return arr.map((x) => str(x, len)).filter(Boolean).slice(0, max);
};

/* ---------- auth helpers ---------- */
function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  try { return fs.readFileSync(FILES.secret, "utf8"); } catch { /* create below */ }
  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(FILES.secret, secret, { mode: 0o600 });
  return secret;
}
const SECRET = getSecret();

const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16);
  return `${salt.toString("hex")}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
};
const verifyPassword = (pw, stored) => {
  const [salt, key] = String(stored).split(":");
  if (!salt || !key) return false;
  const a = crypto.scryptSync(pw, Buffer.from(salt, "hex"), 64);
  const b = Buffer.from(key, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, saved: u.saved || [] });
const signToken = (u) => jwt.sign({ sub: u.id }, SECRET, { expiresIn: "7d" });

function userFromRequest(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const { sub } = jwt.verify(header.slice(7), SECRET);
    return readJSON(FILES.users).find((u) => u.id === sub) || null;
  } catch { return null; }
}
const optionalAuth = (req, _res, next) => { req.user = userFromRequest(req); next(); };
const requireAuth = (req, res, next) => {
  req.user = userFromRequest(req);
  if (!req.user) return res.status(401).json({ error: "Please sign in to do that" });
  next();
};

// Very small in-memory brute-force guard: 8 failed logins per 15 minutes per email+IP.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
function tooManyAttempts(key) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW) return false;
  return a.count >= 8;
}
function recordFailure(key) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW) attempts.set(key, { count: 1, first: Date.now() });
  else a.count += 1;
}

/* ---------- events ---------- */
function buildEvent(body, user) {
  const title = str(body.title, 120);
  const category = str(body.category, 40);
  const city = str(body.city, 80);
  const date = str(body.date, 10);
  const end = str(body.end, 10) || date;
  if (!title || !category || !date || !(city || str(body.location, 120))) {
    return { error: "title, category, location (or city) and date are required" };
  }
  if (!CATEGORIES.includes(category)) return { error: `category must be one of: ${CATEGORIES.join(", ")}` };
  if (!isDate(date)) return { error: "date must be YYYY-MM-DD" };
  if (!isDate(end) || end < date) return { error: "end date must be a valid date on or after the start date" };
  const time = str(body.time, 5) || "09:00";
  const endTime = str(body.endTime, 5);
  if (!isTime(time) || (endTime && !isTime(endTime))) return { error: "time must be HH:MM" };
  const region = REGIONS.includes(body.region) ? body.region : "Other";
  const kind = KINDS.includes(body.kind) ? body.kind : KIND_BY_CATEGORY[category];
  const image = str(body.image, 500);
  if (image && !isUrl(image)) return { error: "image must be an http(s) URL" };
  const cityName = city || str(body.location, 120).replace(/,\s*France$/i, "");
  const lat = num(body.lat, -90, 90), lng = num(body.lng, -180, 180);
  const event = {
    id: `evt-${crypto.randomUUID().slice(0, 8)}`,
    title, category, region,
    city: cityName,
    venue: str(body.venue, 120),
    location: str(body.location, 120) || `${cityName}, France`,
    date, end, time,
    price: str(body.price, 40) || "Free",
    featured: false,
    kind,
    description: str(body.description, 1000),
    highlights: list(body.highlights, 8, 140),
    tags: list(body.tags, 8, 30),
    custom: true,
    createdBy: user.id,
    createdByName: user.name,
  };
  if (lat !== null && lng !== null) { event.lat = lat; event.lng = lng; }
  if (endTime) event.endTime = endTime;
  if (str(body.dur, 30)) event.dur = str(body.dur, 30);
  if (image) event.image = image;
  return { event };
}

/* ---------- app ---------- */
const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "RALLYA API" }));
app.get("/api/config", (_req, res) => res.json({ auth: true, liveEvents: true, redbullEvents: true, ticketmaster: Boolean(TM_KEY), places: true }));

/* --- auth --- */
app.post("/api/auth/register", (req, res) => {
  const name = str(req.body?.name, 60);
  const email = str(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name) return res.status(400).json({ error: "Please enter your name" });
  if (!isEmail(email)) return res.status(400).json({ error: "Please enter a valid email address" });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must be 8–128 characters" });
  const users = readJSON(FILES.users);
  if (users.some((u) => u.email === email)) return res.status(409).json({ error: "An account with that email already exists. Try signing in." });
  const user = { id: `usr-${crypto.randomUUID().slice(0, 8)}`, name, email, passwordHash: hashPassword(password), saved: [], createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON(FILES.users, users);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const email = str(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const key = `${req.ip}|${email}`;
  if (tooManyAttempts(key)) return res.status(429).json({ error: "Too many attempts. Please wait a few minutes and try again." });
  const user = readJSON(FILES.users).find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailure(key);
    return res.status(401).json({ error: "Incorrect email or password" });
  }
  attempts.delete(key);
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

app.put("/api/me/saved", requireAuth, (req, res) => {
  const saved = list(req.body?.saved, 200, 60);
  const users = readJSON(FILES.users);
  const i = users.findIndex((u) => u.id === req.user.id);
  users[i].saved = saved;
  writeJSON(FILES.users, users);
  res.json({ saved });
});

/* --- events --- */
app.get("/api/events", (req, res) => {
  let events = readJSON(FILES.events);
  const { category, region, search, featured, upcoming } = req.query;
  if (category && category !== "All") events = events.filter((e) => e.category === category);
  if (region && region !== "All") events = events.filter((e) => e.region === region);
  if (search) {
    const q = String(search).toLowerCase();
    events = events.filter((e) =>
      `${e.title} ${e.location} ${e.venue || ""} ${e.category} ${(e.tags || []).join(" ")}`.toLowerCase().includes(q));
  }
  if (featured === "true") events = events.filter((e) => e.featured);
  if (upcoming === "true") {
    const today = new Date().toISOString().slice(0, 10);
    events = events.filter((e) => (e.end || e.date) >= today);
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  // never expose internal ownership ids
  res.json(events.map(({ createdBy, ...rest }) => rest));
});

app.get("/api/events/mine", requireAuth, (req, res) => {
  res.json(readJSON(FILES.events).filter((e) => e.createdBy === req.user.id).map((e) => e.id));
});

app.get("/api/events/:id", (req, res) => {
  const event = readJSON(FILES.events).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const { createdBy, ...rest } = event;
  res.json(rest);
});

app.post("/api/events", requireAuth, (req, res) => {
  const { event, error } = buildEvent(req.body || {}, req.user);
  if (error) return res.status(400).json({ error });
  const events = readJSON(FILES.events);
  events.push(event);
  writeJSON(FILES.events, events);
  const { createdBy, ...rest } = event;
  res.status(201).json(rest);
});

app.delete("/api/events/:id", requireAuth, (req, res) => {
  const events = readJSON(FILES.events);
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.createdBy !== req.user.id) return res.status(403).json({ error: "You can only delete events you created" });
  writeJSON(FILES.events, events.filter((e) => e.id !== req.params.id));
  res.json({ ok: true });
});

app.get("/api/resorts", (_req, res) => res.json(readJSON(FILES.resorts)));

/* --- newsletter + reservations --- */
app.post("/api/subscribe", (req, res) => {
  const email = str(req.body?.email, 254).toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: "Please enter a valid email address" });
  const subs = readJSON(FILES.subscribers);
  if (!subs.some((s) => s.email === email)) {
    subs.push({ email, createdAt: new Date().toISOString() });
    writeJSON(FILES.subscribers, subs);
  }
  res.status(201).json({ ok: true });
});

app.post("/api/reservations", optionalAuth, (req, res) => {
  const eventId = str(req.body?.eventId, 60);
  const event = readJSON(FILES.events).find((e) => e.id === eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const reservations = readJSON(FILES.reservations);
  const reservation = {
    id: `res-${crypto.randomUUID().slice(0, 8)}`, eventId,
    userId: req.user?.id || null, email: req.user?.email || "", createdAt: new Date().toISOString(),
  };
  reservations.push(reservation);
  writeJSON(FILES.reservations, reservations);
  res.status(201).json({ id: reservation.id, eventId });
});

/* --- optional live events from Ticketmaster (needs TICKETMASTER_KEY) --- */
const tmCache = new Map();
const TM_CATEGORY = { Music: "DJ & Music", Sports: "Sports", "Arts & Theatre": "Culture" };
const TM_KIND = { "DJ & Music": "dj", Sports: "city", Culture: "culture" };
const regionFor = (city = "") => {
  if (/paris/i.test(city)) return "Paris";
  if (/lyon/i.test(city)) return "Lyon";
  if (/nice|cannes|antibes|monaco|marseille|toulon/i.test(city)) return "Riviera";
  if (/chamonix|annecy|grenoble|tignes|megeve|morzine|courchevel/i.test(city)) return "Alps";
  return "Other";
};
function mapTicketmaster(ev) {
  const venue = ev._embedded?.venues?.[0] || {};
  const segment = ev.classifications?.[0]?.segment?.name;
  const category = TM_CATEGORY[segment] || "Culture";
  const city = venue.city?.name || "France";
  const pr = ev.priceRanges?.[0];
  const cur = pr?.currency === "EUR" ? "€" : pr?.currency ? `${pr.currency} ` : "€";
  const image = (ev.images || []).filter((i) => i.ratio === "16_9").sort((a, b) => b.width - a.width)[0]?.url;
  const lat = num(venue.location?.latitude, -90, 90), lng = num(venue.location?.longitude, -180, 180);
  const date = ev.dates?.start?.localDate;
  if (!date) return null;
  const out = {
    id: `tm-${ev.id}`, title: ev.name, category, region: regionFor(city), city, venue: venue.name || "",
    location: `${city}, France`, date, end: date, time: (ev.dates?.start?.localTime || "20:00").slice(0, 5),
    price: pr ? `From ${cur}${Math.round(pr.min)}` : "See tickets", featured: false, kind: TM_KIND[category],
    description: ev.info || ev.pleaseNote || `${ev.name}${venue.name ? ` at ${venue.name}` : ""}.`,
    highlights: [], tags: [segment, ev.classifications?.[0]?.genre?.name].filter((t) => t && t !== "Undefined"),
    external: true, source: "Ticketmaster", ticketUrl: ev.url,
  };
  if (image) out.image = image;
  if (lat !== null && lng !== null) { out.lat = lat; out.lng = lng; }
  return out;
}
app.get("/api/live/ticketmaster", async (req, res) => {
  if (!TM_KEY) return res.status(501).json({ error: "Live events are off. Set TICKETMASTER_KEY to enable them." });
  const keyword = str(req.query.keyword, 60);
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", TM_KEY);
  url.searchParams.set("countryCode", str(req.query.countryCode, 4).toUpperCase() || "FR");
  url.searchParams.set("size", "40");
  url.searchParams.set("sort", "date,asc");
  if (keyword) url.searchParams.set("keyword", keyword);
  const cacheKey = url.searchParams.toString();
  const hit = tmCache.get(cacheKey);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return res.json(hit.data);
  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: "Ticketmaster request failed" });
    const json = await r.json();
    const data = (json._embedded?.events || []).map(mapTicketmaster).filter(Boolean);
    tmCache.set(cacheKey, { t: Date.now(), data });
    res.json(data);
  } catch {
    res.status(502).json({ error: "Couldn't reach Ticketmaster" });
  }
});



/* ---------- official Red Bull event feed ----------
   Red Bull does not publish a documented public events API. This adapter keeps
   a small, source-linked catalog of events surfaced on Red Bull's official
   calendar and exposes the official page so users can verify registration,
   tickets and final dates. Refresh this list when the official calendar changes.
*/
const redBullEvents = [
  {
    id: "rb-megaloop-2026", title: "Red Bull Megaloop", category: "Adventure", region: "Other",
    city: "Noordwijk", venue: "KSN Noordwijk", location: "Noordwijk, Netherlands",
    date: "2026-08-29", end: "2026-11-07", time: "09:00", price: "See official page",
    featured: true, kind: "sea", description: "Red Bull's extreme kitesurfing event on the Dutch coast. The wind window is weather-dependent.",
    highlights: ["Kitesurfing", "North Sea coast", "Weather-dependent event"], tags: ["Red Bull", "Kitesurfing", "Netherlands", "Outdoor"],
    lat: 52.2396, lng: 4.4347, external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/nl-nl/events/red-bull-megaloop"
  },
  {
    id: "rb-dance-montpellier-2026", title: "Red Bull Dance Your Style National Final", category: "DJ & Music", region: "Other",
    city: "Montpellier", venue: "Montpellier", location: "Montpellier, France",
    date: "2026-09-23", end: "2026-09-26", time: "18:00", price: "See official page", featured: true, kind: "dj",
    description: "Street-dance battles in Montpellier, with the audience choosing the winner.",
    highlights: ["Street dance battles", "Audience-selected winner", "French national final"], tags: ["Red Bull", "Dance", "France"],
    lat: 43.6119, lng: 3.8772, external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/fr-fr/events"
  },
  {
    id: "rb-cycling-survivor-2026", title: "Red Bull Cycling Survivor", category: "Sports", region: "Other",
    city: "Charade", venue: "Circuit de Charade", location: "Circuit de Charade, France",
    date: "2026-09-26", end: "2026-09-26", time: "09:00", price: "See official page", featured: false, kind: "city",
    description: "An amateur cycling challenge testing all-round ability at Circuit de Charade.",
    highlights: ["Amateur cycling", "Circuit de Charade", "Registration details on official site"], tags: ["Red Bull", "Cycling", "France"],
    lat: 45.7435, lng: 2.9997, external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/fr-fr/events"
  },
  {
    id: "rb-wings-cup-france-2026", title: "Red Bull Wings Cup", category: "Sports", region: "Other",
    city: "France", venue: "Multiple locations", location: "France",
    date: "2026-09-29", end: "2026-12-31", time: "09:00", price: "See official page", featured: false, kind: "city",
    description: "Red Bull Wings Cup esports event series in France.", highlights: ["Esports", "Event series", "Official registration information"], tags: ["Red Bull", "Esports", "France"],
    external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/fr-fr/events"
  },
  {
    id: "rb-wings-cup-netherlands-2026", title: "Red Bull Wings Cup", category: "Sports", region: "Other",
    city: "Netherlands", venue: "Multiple locations", location: "Netherlands",
    date: "2026-09-25", end: "2026-11-15", time: "09:00", price: "See official page", featured: false, kind: "city",
    description: "Red Bull Wings Cup event listing for the Netherlands. Check the official calendar for the specific venue and registration details.",
    highlights: ["Esports", "Netherlands", "Official registration information"], tags: ["Red Bull", "Esports", "Netherlands"],
    external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/nl-nl"
  },
  {
    id: "rb-cliff-diving-poli-2026", title: "Red Bull Cliff Diving World Series — Polignano a Mare", category: "Adventure", region: "Other",
    city: "Polignano a Mare", venue: "Polignano a Mare", location: "Polignano a Mare, Italy",
    date: "2026-09-25", end: "2026-09-27", time: "12:00", price: "See official page", featured: false, kind: "sea",
    description: "A Red Bull Cliff Diving World Series stop in southern Italy.", highlights: ["Cliff diving", "World Series", "Italy"], tags: ["Red Bull", "Cliff Diving", "Italy"],
    lat: 40.9966, lng: 17.2215, external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/int-en/events"
  },
  {
    id: "rb-hardline-bc-2026", title: "Red Bull Hardline British Columbia", category: "Adventure", region: "Other",
    city: "Cypress Mountain", venue: "Cypress Mountain", location: "Cypress Mountain, Canada",
    date: "2026-10-17", end: "2026-10-17", time: "09:00", price: "See official page", featured: false, kind: "adventure",
    description: "A Red Bull Hardline mountain-bike event in British Columbia.", highlights: ["Mountain biking", "Cypress Mountain", "Canada"], tags: ["Red Bull", "MTB", "Canada"],
    lat: 49.3967, lng: -123.2031, external: true, source: "Red Bull", ticketUrl: "https://www.redbull.com/int-en/events"
  }
];

app.get("/api/live/redbull", (_req, res) => res.json(redBullEvents));

app.get("/api/live/all", async (req, res) => {
  const output = [...redBullEvents];
  if (TM_KEY) {
    try {
      const countryCode = str(req.query.countryCode, 4).toUpperCase() || "FR";
      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
      url.searchParams.set("apikey", TM_KEY);
      url.searchParams.set("countryCode", countryCode);
      url.searchParams.set("size", "40");
      url.searchParams.set("sort", "date,asc");
      const r = await fetch(url);
      if (r.ok) {
        const json = await r.json();
        output.push(...(json._embedded?.events || []).map(mapTicketmaster).filter(Boolean));
      }
    } catch { /* Red Bull catalog remains available if Ticketmaster is unavailable. */ }
  }
  res.json(output);
});

/* ---------- OpenStreetMap places proxy ----------
   Keeping Overpass and Nominatim calls server-side avoids browser CORS failures.
   Results are cached briefly to respect public-service limits. */
const placesCache = new Map();
const placesTypes = {
  restaurant: '["amenity"="restaurant"]',
  cafe: '["amenity"="cafe"]',
  bar: '["amenity"~"^(bar|pub|nightclub)$"]',
  stay: '["tourism"~"^(hotel|hostel|guest_house|apartment|chalet)$"]'
};
const overpassEndpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
function normalizeOSMPlace(el, type) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
  if (!t.name || typeof lat !== "number" || typeof lng !== "number") return null;
  const address = [[t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), t["addr:city"]].filter(Boolean).join(", ");
  const kind = t.amenity || t.tourism || type;
  return { id: `${el.type}-${el.id}`, name: t.name, type, lat, lng, address,
    cuisine: t.cuisine || kind.replace(/_/g, " "), website: t.website || t["contact:website"] || "",
    phone: t.phone || t["contact:phone"] || "", hours: t.opening_hours || "",
    score: (t.website || t["contact:website"] ? 2 : 0) + (t.opening_hours ? 1 : 0) + (t.cuisine ? 1 : 0) };
}
app.get("/api/places", async (req, res) => {
  const type = str(req.query.type, 20) || "restaurant";
  const lat = num(req.query.lat, -90, 90), lng = num(req.query.lng, -180, 180);
  const radius = Math.min(num(req.query.radius, 250, 10000) || 1500, 10000);
  if (!placesTypes[type] || lat === null || lng === null) return res.status(400).json({ error: "Valid type, lat and lng are required" });
  const key = `${type}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`;
  const cached = placesCache.get(key);
  if (cached && Date.now() - cached.t < 6 * 60 * 60 * 1000) return res.json(cached.data);
  const q = `[out:json][timeout:25];(node${placesTypes[type]}["name"](around:${radius},${lat},${lng});way${placesTypes[type]}["name"](around:${radius},${lat},${lng}););out center tags 80;`;
  let lastError;
  for (const endpoint of overpassEndpoints) {
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "RALLYA/1.0 local development app" }, body: `data=${encodeURIComponent(q)}` });
      if (!r.ok) throw new Error(`Overpass HTTP ${r.status}`);
      const json = await r.json();
      const seen = new Set();
      const data = (json.elements || []).map((e) => normalizeOSMPlace(e, type)).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).sort((a,b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 60);
      placesCache.set(key, { t: Date.now(), data });
      return res.json(data);
    } catch (e) { lastError = e; }
  }
  res.status(502).json({ error: lastError?.message || "Places service unavailable" });
});

app.get("/api/geocode", async (req, res) => {
  const q = str(req.query.q, 160);
  if (!q) return res.status(400).json({ error: "q is required" });
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json"); url.searchParams.set("limit", "1"); url.searchParams.set("q", q);
    const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "RALLYA/1.0 local development app" } });
    if (!r.ok) return res.status(502).json({ error: "Geocoding failed" });
    const data = await r.json(); const hit = data[0];
    res.json(hit ? { lat: Number(hit.lat), lng: Number(hit.lon), name: hit.display_name } : null);
  } catch { res.status(502).json({ error: "Geocoding service unavailable" }); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

/* Serve the built frontend when it exists (npm run build in /frontend) */
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (_req, res) => res.sendFile(path.join(DIST_DIR, "index.html")));
}

app.listen(PORT, () => console.log(`RALLYA API running at http://localhost:${PORT}`));
