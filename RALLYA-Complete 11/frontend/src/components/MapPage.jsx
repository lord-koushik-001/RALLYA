import React, { useMemo, useState } from "react";
import { MapPin, Mountain } from "lucide-react";
import MapView from "./MapView.jsx";
import { rangeText } from "../lib/time.js";

const CATS = ["All", "Sports", "Adventure", "Travel", "DJ & Music", "Culture"];

export default function MapPage({ events, resorts, now, onOpen }) {
  const [showEvents, setShowEvents] = useState(true);
  const [showResorts, setShowResorts] = useState(true);
  const [cat, setCat] = useState("All");
  const [focus, setFocus] = useState(null);
  const goTo = (id) => setFocus({ id, n: Date.now() });

  const upcoming = useMemo(() => events.filter((e) => e.endMs >= now && typeof e.lat === "number" && (cat === "All" || e.category === cat)).sort((a, b) => a.startMs - b.startMs), [events, now, cat]);
  const markers = useMemo(() => [
    ...(showEvents ? upcoming.map((e) => ({ id: e.id, kind: "event", lat: e.lat, lng: e.lng, title: e.title, subtitle: `${rangeText(e)} · ${e.city}`, actionLabel: "View details", ref: e })) : []),
    ...(showResorts ? resorts.filter((r) => typeof r.lat === "number").map((r) => ({ id: `resort-${r.id}`, kind: "resort", lat: r.lat, lng: r.lng, title: `${r.name} (ski resort)`, subtitle: `${r.altitude.toLocaleString("en-US")} m · ${r.length} day season` })) : []),
  ], [upcoming, resorts, showEvents, showResorts]);

  return (
    <section className="section page-section">
      <div className="eyebrow">EXPLORE THE MAP</div>
      <h1>Events across Europe & beyond</h1>
      <p className="muted">Every pin is an event or an Alpine resort. Live Red Bull listings can include locations outside France. Click a pin for details; pins mark the town when an exact venue is unavailable.</p>

      <div className="map-controls">
        <div className="category-row">{CATS.map((c) => <button key={c} className={cat === c ? "category active" : "category"} onClick={() => setCat(c)}>{c}</button>)}</div>
        <div className="legend">
          <label className="switch"><input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} /><span className="dot event" /> Events</label>
          <label className="switch"><input type="checkbox" checked={showResorts} onChange={(e) => setShowResorts(e.target.checked)} /><span className="dot resort" /> Alps resorts</label>
        </div>
      </div>

      <div className="map-layout">
        <MapView markers={markers} height={560} focus={focus} onSelect={(m) => m.ref && onOpen(m.ref)} />
        <aside className="map-list" aria-label="Events on the map">
          {showEvents && upcoming.map((e) => (
            <button key={e.id} className="map-item" onClick={() => goTo(e.id)} onDoubleClick={() => onOpen(e)}>
              <span className="dot event" />
              <span><b>{e.title}</b><small><MapPin size={11} /> {e.city} · {rangeText(e)}</small></span>
            </button>
          ))}
          {showResorts && resorts.map((r) => (
            <button key={r.id} className="map-item" onClick={() => goTo(`resort-${r.id}`)}>
              <span className="dot resort" />
              <span><b>{r.name}</b><small><Mountain size={11} /> {r.altitude.toLocaleString("en-US")} m · opens {r.open}</small></span>
            </button>
          ))}
          {markers.length === 0 && <p className="muted small">Nothing to show — turn a layer back on.</p>}
        </aside>
      </div>
      <p className="note">Map data © OpenStreetMap contributors. Double-click a list item to open its event page.</p>
    </section>
  );
}
