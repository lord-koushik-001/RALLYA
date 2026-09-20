import React, { useEffect, useMemo, useState } from "react";
import { Utensils, Coffee, Wine, BedDouble, Navigation, Globe, Phone, Clock3, LocateFixed, MapPin } from "lucide-react";
import MapView from "./MapView.jsx";
import Art from "../lib/Art.jsx";
import { PLACE_TYPES, searchPlaces, directionsUrl } from "../lib/places.js";

const TYPE_ICON = { restaurant: Utensils, cafe: Coffee, bar: Wine, stay: BedDouble };

export function PlaceCard({ p }) {
  return (
    <article className="place-card">
      <div className="place-thumb"><Art kind={PLACE_TYPES[p.type].art} id={p.id} /></div>
      <div className="place-info">
        <h3>{p.name}</h3>
        <span className="tag">{p.cuisine}</span>
        {p.address && <p className="muted small"><MapPin size={12} /> {p.address}</p>}
        {p.hours && <p className="muted small"><Clock3 size={12} /> {p.hours.length > 60 ? `${p.hours.slice(0, 57)}…` : p.hours}</p>}
        <div className="place-links">
          <a href={directionsUrl(p)} target="_blank" rel="noreferrer"><Navigation size={13} /> Directions</a>
          {p.website && /^https?:\/\//.test(p.website) && <a href={p.website} target="_blank" rel="noreferrer"><Globe size={13} /> Website</a>}
          {p.phone && <a href={`tel:${p.phone.replace(/[^+\d]/g, "")}`}><Phone size={13} /> Call</a>}
        </div>
      </div>
    </article>
  );
}

export default function PlacesPage({ hubs, initialHub }) {
  const [hubName, setHubName] = useState(initialHub || hubs[0]?.name);
  const [custom, setCustom] = useState(null);
  const [type, setType] = useState("restaurant");
  const [radius, setRadius] = useState(1500);
  const [state, setState] = useState({ loading: false, error: "", list: [] });
  const [focus, setFocus] = useState(null);
  const [locating, setLocating] = useState(false);

  const hub = custom || hubs.find((h) => h.name === hubName) || hubs[0];

  useEffect(() => {
    if (!hub) return undefined;
    let live = true;
    setState({ loading: true, error: "", list: [] });
    searchPlaces(hub.lat, hub.lng, type, radius)
      .then((list) => live && setState({ loading: false, error: "", list }))
      .catch(() => live && setState({ loading: false, error: "Couldn't reach the places service (OpenStreetMap). Check your connection and try again.", list: [] }));
    return () => { live = false; };
  }, [hub?.lat, hub?.lng, type, radius]);

  const markers = useMemo(() => [
    ...(hub ? [{ id: "hub", kind: "event", lat: hub.lat, lng: hub.lng, title: hub.name, subtitle: "Search centre" }] : []),
    ...state.list.map((p) => ({ id: p.id, kind: "place", lat: p.lat, lng: p.lng, title: p.name, subtitle: p.cuisine })),
  ], [state.list, hub]);

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCustom({ name: "Near you", lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  return (
    <section className="section page-section">
      <div className="eyebrow">EAT · DRINK · STAY</div>
      <h1>Places near the action</h1>
      <p className="muted">Real restaurants, cafés, bars and places to stay around each destination, from OpenStreetMap.</p>

      <div className="hub-row">
        {hubs.map((h) => <button key={h.name} className={!custom && hub?.name === h.name ? "category active" : "category"} onClick={() => { setCustom(null); setHubName(h.name); }}>{h.name}</button>)}
        <button className={custom ? "category active" : "category"} onClick={locate} disabled={locating}><LocateFixed size={15} /> {locating ? "Locating…" : "Near me"}</button>
      </div>

      <div className="filter-foot" style={{ marginTop: 18 }}>
        <div className="collection-row" style={{ margin: 0 }}>
          {Object.entries(PLACE_TYPES).map(([key, cfg]) => { const I = TYPE_ICON[key]; return <button key={key} className={type === key ? "chip active" : "chip"} onClick={() => setType(key)}><I size={13} style={{ verticalAlign: -2 }} /> {cfg.label}</button>; })}
        </div>
        <label className="field inline"><span>Radius</span>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}><option value={1000}>1 km</option><option value={1500}>1.5 km</option><option value={3000}>3 km</option><option value={5000}>5 km</option></select>
        </label>
      </div>

      <div className="map-layout places">
        <MapView markers={markers} height={620} focus={focus} />
        <div className="place-list">
          {state.loading && <div className="empty">Finding places…</div>}
          {state.error && <div className="empty">{state.error}</div>}
          {!state.loading && !state.error && state.list.length === 0 && <div className="empty">No {PLACE_TYPES[type].label.toLowerCase()} found within that radius. Try a wider search.</div>}
          {state.list.map((p) => (
            <div key={p.id} onClick={() => setFocus({ id: p.id, n: Date.now() })}><PlaceCard p={p} /></div>
          ))}
        </div>
      </div>
      <p className="note">Place data © OpenStreetMap contributors (ODbL). OpenStreetMap has no ratings or reviews, and opening hours or details may be incomplete.</p>
    </section>
  );
}
