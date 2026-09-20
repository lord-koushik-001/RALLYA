import React from "react";
import { MapPin, CalendarDays, ArrowUpRight, Bookmark, BookmarkCheck, Clock3 } from "lucide-react";
import EventImage from "./EventImage.jsx";
import { rangeText, statusOf, durationText } from "../lib/time.js";

export default function EventCard({ e, now, saved, onSave, onOpen }) {
  const st = statusOf(e, now);
  return (
    <article className={`event-card${st.key === "ended" ? " is-ended" : ""}`}>
      <EventImage e={e} className="event-image">
        <span className="pill">{e.category}</span>
        <button className={saved ? "save-button on" : "save-button"} onClick={onSave} aria-pressed={saved} aria-label={saved ? "Remove from my plan" : "Save to my plan"}>
          {saved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
        </button>
        <span className={`status status-${st.key}`}>{st.text}</span>
      </EventImage>
      <div className="event-body">
        <div className="event-top">
          <span className="event-date"><CalendarDays size={14} />{rangeText(e)}</span>
          <span className="days-left"><Clock3 size={12} /> {durationText(e)}</span>
        </div>
        <h3>{e.title}</h3>
        <p className="location"><MapPin size={14} />{e.city ? `${e.city}${e.venue ? ` · ${e.venue}` : ""}` : e.location}</p>
        <p className="description">{e.description}</p>
        <div className="card-bottom">
          <span className="price">{e.price}</span>
          <button className="arrow-button" onClick={onOpen} aria-label={`View details for ${e.title}`}><ArrowUpRight size={18} /></button>
        </div>
      </div>
    </article>
  );
}
