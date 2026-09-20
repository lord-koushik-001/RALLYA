import React from "react";
import { Bookmark, X } from "lucide-react";
import EventImage from "./EventImage.jsx";
import Countdown from "./Countdown.jsx";
import { rangeText, durationText, statusOf } from "../lib/time.js";

export default function PlanPage({ events, now, saved, onSave, onOpen, go, user }) {
  const list = events.filter((e) => saved.includes(e.id)).sort((a, b) => a.startMs - b.startMs);
  const upcoming = list.filter((e) => e.endMs >= now);
  const next = upcoming[0];
  return (
    <section className="section page-section">
      <div className="eyebrow">YOUR SHORTLIST</div>
      <h1>My plan</h1>
      <p className="muted">Your saved experiences, in date order, with the time left for each.</p>
      {user ? <p className="muted small">Signed in as {user.name} — your plan syncs to your account.</p> : <p className="muted small">You're browsing as a guest. <button className="text-button inline" onClick={() => go("login")}>Sign in</button> to keep your plan on every device.</p>}

      {next && (
        <div className="plan-next">
          <div><small>Next on your plan</small><h3>{next.title}</h3><span>{rangeText(next)} · {next.location}</span></div>
          <Countdown target={next.startMs > now ? next.startMs : next.endMs} dark />
        </div>
      )}

      <div className="plan-list">
        {list.map((e) => {
          const st = statusOf(e, now);
          return (
            <article className={`plan-item${st.key === "ended" ? " is-ended" : ""}`} key={e.id}>
              <EventImage e={e} className="plan-thumb" />
              <div className="plan-info" onClick={() => onOpen(e)} role="button" tabIndex={0} onKeyDown={(ev) => ev.key === "Enter" && onOpen(e)}>
                <span className="pill soft">{e.category}</span>
                <h3>{e.title}</h3>
                <p className="muted">{rangeText(e)} · runs {durationText(e)} · {e.location}</p>
              </div>
              <span className={`status inline status-${st.key}`}>{st.text}</span>
              <button className="icon-button" onClick={() => onSave(e.id)} aria-label={`Remove ${e.title}`}><X size={16} /></button>
            </article>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="empty"><Bookmark size={30} />You haven't saved any events yet.
          <button className="primary" onClick={() => go("discover")}>Discover events</button></div>
      )}
    </section>
  );
}
