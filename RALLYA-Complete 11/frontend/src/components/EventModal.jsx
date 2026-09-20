import React, { useEffect, useState } from "react";
import { X, MapPin, Bookmark, BookmarkCheck, Ticket, Download, Trash2, Check, ExternalLink, Utensils } from "lucide-react";
import EventImage from "./EventImage.jsx";
import Countdown from "./Countdown.jsx";
import MapView from "./MapView.jsx";
import WeatherCard from "./WeatherCard.jsx";
import { PlaceCard } from "./PlacesPage.jsx";
import { searchPlaces } from "../lib/places.js";
import { rangeText, durationText, fmtTime, statusOf, makeICS } from "../lib/time.js";

export default function EventModal({ e, now, saved, canDelete, onSave, onClose, onTicket, onDelete, onSeeMore }) {
  const [confirming, setConfirming] = useState(false);
  const [food, setFood] = useState(null); // null = not loaded, { loading, error, list }

  useEffect(() => {
    const onKey = (ev) => ev.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const st = statusOf(e, now);
  const ended = st.key === "ended";
  const live = st.key === "live";
  const hasCoords = typeof e.lat === "number" && typeof e.lng === "number";

  function download() {
    const blob = new Blob([makeICS(e)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${e.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function loadFood() {
    setFood({ loading: true, error: "", list: [] });
    searchPlaces(e.lat, e.lng, "restaurant", 1500)
      .then((list) => setFood({ loading: false, error: "", list: list.slice(0, 4) }))
      .catch(() => setFood({ loading: false, error: "Couldn't load restaurants right now.", list: [] }));
  }

  return (
    <div className="overlay" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={e.title}>
        <button className="close" onClick={onClose} aria-label="Close"><X /></button>
        <EventImage e={e} className="modal-image"><span className={`status status-${st.key}`}>{st.text}</span></EventImage>
        <div className="modal-content">
          <span className="pill">{e.category}</span>{e.source && <span className="pill soft ml">via {e.source}</span>}
          <h2>{e.title}</h2>
          <p className="location"><MapPin size={15} />{e.venue ? `${e.venue}, ${e.location}` : e.location}</p>

          {ended ? <div className="countdown ended-note">This event has ended.</div> : (
            <div className="modal-cd"><span className="cd-label">{live ? "Ends in" : "Starts in"}</span><Countdown target={live ? e.endMs : e.startMs} /></div>
          )}

          <div className="info-grid">
            <div><small>Dates</small><b>{rangeText(e)}</b></div>
            <div><small>How long it runs</small><b>{durationText(e)}</b></div>
            <div><small>Starts (France time)</small><b>{fmtTime(e.startMs)}</b></div>
            <div><small>Price</small><b>{e.price}</b></div>
          </div>

          <p className="modal-desc">{e.description}</p>
          {e.highlights.length > 0 && <ul className="highlights">{e.highlights.map((h) => <li key={h}><Check size={15} />{h}</li>)}</ul>}
          {e.tags.length > 0 && <div className="tag-row">{e.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>}

          {hasCoords && (
            <>
              <h3 className="modal-h">Weather at {e.city}</h3>
              <WeatherCard lat={e.lat} lng={e.lng} event={e} />
              <h3 className="modal-h">Where it is</h3>
              <MapView markers={[{ id: e.id, kind: "event", lat: e.lat, lng: e.lng, title: e.title, subtitle: e.city }]} height={220} />
              <p className="muted small">Pin marks the town, not the exact venue.</p>
              <h3 className="modal-h">Eat & drink nearby</h3>
              {!food && <button className="secondary" onClick={loadFood}><Utensils size={15} /> Show restaurants nearby</button>}
              {food?.loading && <p className="muted small">Finding places…</p>}
              {food?.error && <p className="muted small">{food.error}</p>}
              {food && !food.loading && !food.error && (
                <>
                  {food.list.length === 0 ? <p className="muted small">No restaurants found within 1.5 km.</p> : <div className="place-stack">{food.list.map((p) => <PlaceCard key={p.id} p={p} />)}</div>}
                  <button className="text-button" onClick={() => onSeeMore(e)}>See more places around {e.city}</button>
                </>
              )}
            </>
          )}

          <div className="modal-actions">
            <button className="primary" onClick={onSave}>{saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />} {saved ? "Saved to plan" : "Save to my plan"}</button>
            {!ended && (e.ticketUrl
              ? <a className="primary red" href={e.ticketUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Buy tickets</a>
              : <button className="primary red" onClick={onTicket}><Ticket size={17} /> {e.price === "Free" ? "Reserve a spot" : "Get tickets"}</button>)}
            <button className="secondary" onClick={download}><Download size={15} /> Add to calendar</button>
            {canDelete && (confirming
              ? <button className="secondary danger" onClick={onDelete}><Trash2 size={15} /> Confirm delete</button>
              : <button className="secondary danger" onClick={() => setConfirming(true)}><Trash2 size={15} /> Delete</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}
