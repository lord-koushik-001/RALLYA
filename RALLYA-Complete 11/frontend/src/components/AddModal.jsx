import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createEvent } from "../lib/api.js";
import { geocode } from "../lib/places.js";

const REGIONS = ["Alps", "Paris", "Lyon", "Riviera", "Provence", "Other"];
const blank = { title: "", category: "Sports", region: "Alps", city: "", venue: "", date: "", end: "", time: "09:00", endTime: "", price: "Free", image: "", tags: "", description: "", highlights: "" };

export default function AddModal({ categories, onClose, onCreated }) {
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    const onKey = (ev) => ev.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.end && form.end < form.date) { setError("The end date can't be before the start date."); return; }
    setBusy(true);
    try {
      const split = (v, sep) => v.split(sep).map((x) => x.trim()).filter(Boolean);
      // Pin the event on the map: look the city up on OpenStreetMap (optional — skipped if unavailable).
      let coords = {};
      try { const g = await geocode(`${form.city}, France`); if (g) coords = { lat: g.lat, lng: g.lng }; } catch { /* no pin */ }
      await createEvent({ ...form, ...coords, end: form.end || form.date, tags: split(form.tags, ","), highlights: split(form.highlights, "\n") });
      onCreated();
    } catch (err) { setError(err.message || "Couldn't create the event."); }
    finally { setBusy(false); }
  }

  const F = ({ name, label, type = "text", required, placeholder, full }) => (
    <label className={full ? "full" : ""}>{label}
      <input required={required} name={name} type={type} value={form[name]} onChange={change} placeholder={placeholder} />
    </label>
  );

  return (
    <div className="overlay" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <form className="modal form-modal" onSubmit={submit}>
        <button type="button" className="close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="eyebrow">CREATE AN EXPERIENCE</div>
        <h2>Add an event</h2>
        <div className="form-grid">
          {F({ name: "title", label: "Title", required: true, full: true, placeholder: "e.g. Summer Rooftop Sessions" })}
          <label>Category<select name="category" value={form.category} onChange={change}>{categories.filter((x) => x !== "All").map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Region<select name="region" value={form.region} onChange={change}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
          {F({ name: "city", label: "City", required: true, placeholder: "Chamonix" })}
          {F({ name: "venue", label: "Venue", placeholder: "Optional" })}
          {F({ name: "date", label: "Start date", type: "date", required: true })}
          {F({ name: "end", label: "End date (optional)", type: "date" })}
          {F({ name: "time", label: "Start time", type: "time" })}
          {F({ name: "endTime", label: "End time (optional)", type: "time" })}
          {F({ name: "price", label: "Price", placeholder: "Free or From €25" })}
          {F({ name: "image", label: "Image URL (optional)", placeholder: "https://..." })}
          {F({ name: "tags", label: "Tags", full: true, placeholder: "snow, music, adventure" })}
          <label className="full">Description<textarea name="description" value={form.description} onChange={change} rows="3" /></label>
          <label className="full">Highlights (one per line)<textarea name="highlights" value={form.highlights} onChange={change} rows="3" /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? "Creating..." : "Create event"}</button>
      </form>
    </div>
  );
}
