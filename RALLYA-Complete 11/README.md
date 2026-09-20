# RALLYA — Complete React + Node.js Event Platform

RALLYA is an event discovery website for **sports, Red Bull-style action events, alpine adventures, travel, DJ/music nights and culture in France** — with live countdowns, accounts, maps, weather, photos and nearby restaurants.

## Stack
- React 18 + Vite frontend (`/frontend`), Leaflet maps
- Node.js + Express backend (`/backend`), JSON file storage (`/backend/data`)
- Free public APIs (no keys needed): OpenStreetMap tiles, Overpass, Nominatim, Open-Meteo, Wikipedia

## Run locally

Run each command on its own line.

### Terminal 1 — backend
```bash
cd RALLYA-Complete/backend
npm install
npm run dev
```
API at `http://localhost:5000`.

### Terminal 2 — frontend
```bash
cd RALLYA-Complete/frontend
npm install
npm run dev
```
Open the Vite URL (normally `http://localhost:5173`). `/api` is proxied to the backend.

### One-server production mode
```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start
```
Express serves the site and API together on `http://localhost:5000`.

If the backend isn't running the site starts in **demo mode** (banner at the top): sample events, and accounts/changes are stored in your browser only.

## Pages (hash routes)
| Route | What it does |
| --- | --- |
| `#/discover` | Hero with live countdown, featured events, filters (search, category, collections, region, date, sort), categories, Alps teaser, newsletter |
| `#/alps` | Snow season tracker: resort photos, live weather + snow depth, opening/closing dates, season progress, Alpine events |
| `#/places` | **Eat & stay**: real restaurants, cafés, bars and hotels around any destination (or "Near me") on a map |
| `#/map` | Every event and resort on one map, with category filters |
| `#/calendar` | Month calendar, multi-day events span all their days |
| `#/plan` | Your saved events with countdowns (syncs to your account) |
| `#/login` | Sign in / create account |

Event pop-ups show a live countdown, weather forecast for the event dates, a map, nearby restaurants, and buttons to save, reserve/buy tickets and add to your calendar (.ics).

## Accounts
- Register / sign in (email + password, min 8 chars). Passwords are hashed with scrypt, sessions use signed 7-day tokens, and repeated failed logins are rate-limited.
- Your saved plan syncs to your account. Adding events needs an account, and you can only delete events you created.
- Not included (needs extra services): password reset by email, social login (Google/Apple), email verification.
- A signing secret is generated in `backend/data/.jwt-secret` on first run. In production set your own: `JWT_SECRET=... npm start`.

## APIs used
| Feature | Service | Key? |
| --- | --- | --- |
| Map tiles | OpenStreetMap via Leaflet | No — fine for light use; use a tile provider for heavy traffic |
| Restaurants, cafés, bars, hotels | OpenStreetMap Overpass API | No — data has no ratings/reviews and can be incomplete |
| Find a city's coordinates (Add event) | OpenStreetMap Nominatim | No — light, user-triggered use only |
| Weather, forecast, snow depth | Open-Meteo | No |
| Photos of places | Wikipedia REST API (credited on the image) | No |
| Live events (optional) | Ticketmaster Discovery API via the backend | **Yes** — `TICKETMASTER_KEY=... npm start` |

Every external call is cached and fails gracefully (generated artwork, "weather unavailable", etc.).
Photo licences vary by image; each photo links back to its Wikipedia article for details.

## Backend API
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health`, `/api/config` | Status; feature flags |
| POST | `/api/auth/register`, `/api/auth/login` | Create account / sign in → `{ token, user }` |
| GET | `/api/auth/me` | Current user (Bearer token) |
| PUT | `/api/me/saved` | Save your plan |
| GET | `/api/events` | List. Query: `category`, `region`, `search`, `featured=true`, `upcoming=true` |
| GET | `/api/events/mine` | IDs of events you created |
| POST / DELETE | `/api/events`, `/api/events/:id` | Create (sign in required) / delete your own |
| GET | `/api/resorts` | Alpine resort data |
| POST | `/api/subscribe`, `/api/reservations` | Newsletter; ticket interest |
| GET | `/api/live/ticketmaster` | Live events (only with `TICKETMASTER_KEY`) |

## Editing content
- Events: `backend/data/events.json` (`title, category, region, city, venue, location, lat, lng, date, end, time, endTime, dur, price, featured, kind, description, highlights, tags, image`)
- Resorts: `backend/data/resorts.json`
- Events without `image` get a Wikipedia photo of their city, then generated artwork. `kind` picks the artwork: `snow, dj, culture, travel, sea, city, adventure`.
- `VITE_API_URL` (see `frontend/.env.example`) points the frontend at an API on another host.

## Important notes
- **Event and resort data is sample content.** Dates, prices and listings are illustrative — replace with verified data before launch, and confirm you may use third-party brand names (e.g. Red Bull, Tomorrowland).
- Map pins for events mark the town, not the exact venue.
- Ticket buttons record interest only (except Ticketmaster listings, which link out). Real payments need a ticketing provider.
- Footer contact details are placeholders.


## Live data integrations

- **Red Bull events:** RALLYA includes a source-linked adapter for events surfaced on Red Bull's official calendars, including Red Bull Megaloop in Noordwijk, Netherlands. Open the official link from an event card to verify registration, tickets, and final event details. Red Bull does not expose a documented public events API, so this catalog should be refreshed when its calendar changes.
- **Ticketmaster:** set `TICKETMASTER_KEY` in the backend environment to add live Ticketmaster events.
- **Restaurants, cafés, bars, and stays:** fetched through the backend from OpenStreetMap/Overpass to avoid browser CORS issues. Details depend on OpenStreetMap tagging and may be incomplete.
- **Maps:** Leaflet + OpenStreetMap tiles. Events without coordinates cannot be pinned; the Red Bull Netherlands entries with known locations include coordinates.

### Run with the new default port

Backend: `npm run dev` from `backend` (default `http://localhost:5001`)
Frontend: `npm run dev` from `frontend` (Vite proxies `/api` to port `5001`)


## UI update

The Discover page now uses a full-width action-sports hero background, transparent navigation styling, expanded global event categories, and an “Everywhere / All experiences / Anytime” hero metadata row. The hero background image is configured in `frontend/src/styles.css` using a remote Unsplash image URL. Replace that URL with an image you have rights to use for production.
