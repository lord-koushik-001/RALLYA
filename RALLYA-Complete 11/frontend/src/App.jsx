import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Filters from "./components/Filters.jsx";
import EventCard from "./components/EventCard.jsx";
import EventModal from "./components/EventModal.jsx";
import AddModal from "./components/AddModal.jsx";
import CalendarPage from "./components/CalendarPage.jsx";
import PlanPage from "./components/PlanPage.jsx";
import AlpsPage from "./components/AlpsPage.jsx";
import MapPage from "./components/MapPage.jsx";
import PlacesPage from "./components/PlacesPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import { Categories, ComingUp, AlpsTeaser, HowItWorks, Newsletter, Footer } from "./components/Sections.jsx";
import { fetchEvents, fetchResorts, fetchConfig, fetchLive, fetchMine, removeEvent, reserve, isDemo, auth } from "./lib/api.js";
import { withTimes, parisMs } from "./lib/time.js";
import { withResortTimes } from "./lib/alps.js";

const CATEGORIES = ["All", "Sports", "Adventure", "Travel", "Music", "Culture", "Food & Drink", "Tech", "Art", "Wellness", "Business", "Other"];
const REGIONS = ["Europe", "France", "Netherlands", "United Kingdom", "Germany", "Italy", "Spain", "North America", "Asia", "South America", "Africa", "Oceania", "Online"];
const COLLECTIONS = [
  { key: "redbull", label: "Red Bull", fn: (e) => e.tags.includes("Red Bull") },
  { key: "snow", label: "Snowboarding", fn: (e) => e.tags.includes("Snowboarding") },
  { key: "night", label: "Nightlife", fn: (e) => e.tags.includes("Nightlife") },
  { key: "free", label: "Free entry", fn: (e) => e.price === "Free" },
];
const PAGES = ["discover", "alps", "places", "map", "calendar", "plan", "login"];
const PAGE_SIZE = 9;
const INITIAL_FILTERS = { query: "", category: "All", region: "All", from: "", sort: "date", savedOnly: false, collection: "" };
const CITY_ALIAS = { "Chamonix-Mont-Blanc": "Chamonix" };

const readHash = () => { const p = window.location.hash.replace(/^#\/?/, ""); return PAGES.includes(p) ? p : "discover"; };
const firstName = (n = "") => n.trim().split(/\s+/)[0] || "there";

function useNow(ms) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(readHash);
  const [placesHub, setPlacesHub] = useState("");
  const [F, setF] = useState(INITIAL_FILTERS);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem("rallya-saved") || "[]"); } catch { return []; } });
  const [user, setUser] = useState(null);
  const [mine, setMine] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const afterLogin = useRef("discover");
  const now = useNow(30000);

  const toast = useCallback((msg) => { setToastMsg(msg); clearTimeout(toast.t); toast.t = setTimeout(() => setToastMsg(""), 2600); }, []);

  const loadEvents = useCallback(async () => {
    const ev = await fetchEvents();
    setEvents(ev);
    return ev;
  }, []);

  const applyUser = useCallback((u) => {
    setUser(u);
    setSaved((local) => {
      const merged = [...new Set([...local, ...(u.saved || [])])];
      if (merged.length !== (u.saved || []).length) auth.saveSaved(merged).catch(() => {});
      return merged;
    });
    fetchMine().then(setMine);
  }, []);

  useEffect(() => {
    (async () => {
      const [, rs, cfg] = await Promise.all([loadEvents(), fetchResorts(), fetchConfig()]);
      setResorts(rs.map(withResortTimes));
      setLoading(false);
      if (cfg.liveEvents) fetchLive().then(setLiveEvents);
      const u = await auth.me();
      if (u) applyUser(u);
    })();
  }, [loadEvents, applyUser]);

  useEffect(() => { try { localStorage.setItem("rallya-saved", JSON.stringify(saved)); } catch { /* ignore */ } }, [saved]);

  useEffect(() => {
    const onHash = () => setPage(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = useCallback((p, arg) => {
    if (p === "places") setPlacesHub(arg || "");
    window.location.hash = `/${p}`; setPage(p); window.scrollTo({ top: 0 });
  }, []);

  const all = useMemo(() => [...events, ...liveEvents].map(withTimes), [events, liveEvents]);
  const selected = all.find((e) => e.id === selectedId) || null;
  const setFilters = (patch) => { setF((f) => ({ ...f, ...patch })); setVisible(PAGE_SIZE); };
  const resetFilters = () => { setF(INITIAL_FILTERS); setVisible(PAGE_SIZE); };

  const toggleSave = (id) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    if (user) auth.saveSaved(next).catch(() => {});
  };

  const requireLogin = (intent, message) => { afterLogin.current = intent; toast(message); go("login"); };
  const openAdd = () => (user ? setShowAdd(true) : requireLogin("add", "Sign in to add events"));

  function onAuth(u, isNew) {
    applyUser(u);
    toast(isNew ? `Welcome to RALLYA, ${firstName(u.name)}!` : `Welcome back, ${firstName(u.name)}!`);
    const intent = afterLogin.current;
    afterLogin.current = "discover";
    if (intent === "add") { go("discover"); setShowAdd(true); } else go(PAGES.includes(intent) && intent !== "login" ? intent : "discover");
  }
  function logout() {
    auth.logout(); setUser(null); setMine([]); setSaved([]); toast("Signed out"); go("discover");
  }

  const hubs = useMemo(() => {
    const map = new Map();
    const add = (name, lat, lng, w) => {
      const n = CITY_ALIAS[name] || name;
      if (typeof lat !== "number" || typeof lng !== "number") return;
      const h = map.get(n) || { name: n, lat, lng, w: 0 };
      h.w += w; map.set(n, h);
    };
    all.forEach((e) => add(e.city, e.lat, e.lng, 1));
    resorts.forEach((r) => add(r.wiki || r.name, r.lat, r.lng, 2));
    return [...map.values()].sort((a, b) => b.w - a.w || a.name.localeCompare(b.name)).slice(0, 12);
  }, [all, resorts]);

  const filtered = useMemo(() => {
    const q = F.query.trim().toLowerCase();
    const col = COLLECTIONS.find((c) => c.key === F.collection);
    const list = all.filter((e) =>
      (F.category === "All" || e.category === F.category || (F.category === "Music" && e.category === "DJ & Music")) &&
      (F.region === "All" || e.region === F.region) &&
      (!col || col.fn(e)) &&
      (!q || `${e.title} ${e.location} ${e.venue || ""} ${e.category} ${e.region || ""} ${e.tags.join(" ")}`.toLowerCase().includes(q)) &&
      (!F.from || e.endMs >= parisMs(F.from, "00:00")) &&
      (!F.savedOnly || saved.includes(e.id)));
    if (F.sort === "name") return list.sort((a, b) => a.title.localeCompare(b.title));
    const up = list.filter((e) => e.endMs >= now).sort((a, b) => a.startMs - b.startMs);
    const past = list.filter((e) => e.endMs < now).sort((a, b) => b.startMs - a.startMs);
    return [...up, ...past];
  }, [all, F, saved, now]);

  const next = useMemo(() => all.filter((e) => e.endMs >= now).sort((a, b) => a.startMs - b.startMs)[0] || null, [all, now]);
  const featured = useMemo(() => all.filter((e) => e.featured && e.endMs >= now).sort((a, b) => a.startMs - b.startMs).slice(0, 3), [all, now]);
  const alpsCount = all.filter((e) => e.region === "Alps" && e.endMs >= now).length;

  const scrollToBrowse = () => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
  const open = (e) => setSelectedId(e.id);
  const card = (e) => <EventCard key={e.id} e={e} now={now} saved={saved.includes(e.id)} onSave={() => toggleSave(e.id)} onOpen={() => setSelectedId(e.id)} />;

  async function onTicket() {
    try { await reserve(selected.id); if (!saved.includes(selected.id)) toggleSave(selected.id); toast(selected.price === "Free" ? "Spot reserved — added to your plan" : "Added to your plan — ticketing opens soon"); }
    catch (err) { toast(err.message || "Couldn't complete that. Please try again."); }
  }
  async function onDelete() {
    try { await removeEvent(selected.id); setSelectedId(null); await loadEvents(); setMine(await fetchMine()); toast("Event deleted"); }
    catch (err) { toast(err.message || "Couldn't delete the event."); }
  }

  return (
    <div className="app">
      <Header page={page} go={go} onAdd={openAdd} savedCount={saved.length} mobileNav={mobileNav} setMobileNav={setMobileNav} user={user} onLogout={logout} />
      {!loading && isDemo() && <div className="demo-banner"><Info size={14} /> Demo mode — the RALLYA API isn't running, so sample events are shown and accounts and changes are saved in this browser only.</div>}

      <main>
        {page === "discover" && (
          <>
            <Hero query={F.query} setQuery={(query) => setFilters({ query })} next={next} now={now} onOpen={open} onSearch={scrollToBrowse} />

            {featured.length > 0 && (
              <section className="section">
                <div className="section-head"><div><div className="eyebrow">HANDPICKED FOR YOU</div><h2>Featured experiences</h2></div><button className="text-button" onClick={() => go("calendar")}>View calendar</button></div>
                <div className="event-grid">{featured.map(card)}</div>
              </section>
            )}

            <section className="section" id="browse">
              <div className="section-head"><div><div className="eyebrow">EXPLORE THE CALENDAR</div><h2>Choose your atmosphere</h2></div><button className="text-button" onClick={() => go("map")}>View on map</button></div>
              <Filters F={F} set={setFilters} categories={CATEGORIES} regions={REGIONS} collections={COLLECTIONS} count={filtered.length} reset={resetFilters} savedCount={saved.length} />
              {loading ? <div className="empty">Loading experiences...</div> : (
                <>
                  <div className="event-grid">{filtered.slice(0, visible).map(card)}</div>
                  {filtered.length === 0 && <div className="empty">No events match those filters yet. Try another category, region or date.</div>}
                  {filtered.length > visible && <div className="more-wrap"><button className="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Show more ({filtered.length - visible} left)</button></div>}
                </>
              )}
            </section>

            {!loading && <ComingUp events={all} now={now} onOpen={open} />}
            <Categories categories={CATEGORIES} events={all} now={now} onPick={(c) => { setFilters({ category: c, region: "All", collection: "" }); scrollToBrowse(); }} />
            {resorts.length > 0 && <AlpsTeaser resorts={resorts} now={now} alpsCount={alpsCount} onGo={() => go("alps")} />}
            <HowItWorks />
            <Newsletter toast={toast} />
          </>
        )}
        {page === "alps" && <AlpsPage resorts={resorts} events={all} now={now} saved={saved} onSave={toggleSave} onOpen={open} go={go} />}
        {page === "places" && hubs.length > 0 && <PlacesPage key={placesHub} hubs={hubs} initialHub={placesHub} />}
        {page === "map" && <MapPage events={all} resorts={resorts} now={now} onOpen={open} />}
        {page === "calendar" && <CalendarPage events={all} now={now} onOpen={open} />}
        {page === "plan" && <PlanPage events={all} now={now} saved={saved} onSave={toggleSave} onOpen={open} go={go} user={user} />}
        {page === "login" && (user
          ? <section className="section page-section"><h1>You're signed in</h1><p className="muted">Signed in as {user.name} ({user.email}).</p><button className="primary" onClick={() => go("discover")}>Back to discover</button></section>
          : <LoginPage ready={!loading} onAuth={onAuth} go={go} />)}
      </main>

      <Footer go={go} />
      {selected && <EventModal e={selected} now={now} saved={saved.includes(selected.id)} canDelete={Boolean(user) && mine.includes(selected.id)} onSave={() => toggleSave(selected.id)} onClose={() => setSelectedId(null)} onTicket={onTicket} onDelete={onDelete}
        onSeeMore={(e) => { setSelectedId(null); go("places", CITY_ALIAS[e.city] || e.city); }} />}
      {showAdd && <AddModal categories={CATEGORIES} onClose={() => setShowAdd(false)} onCreated={async () => { setShowAdd(false); await loadEvents(); setMine(await fetchMine()); toast("Event created"); }} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
