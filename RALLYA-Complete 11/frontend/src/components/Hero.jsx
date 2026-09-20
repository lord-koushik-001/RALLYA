import React from "react";
import { Search, MapPin, Compass, Sparkles, Clock3 } from "lucide-react";
import Countdown from "./Countdown.jsx";
import { durationText, rangeText } from "../lib/time.js";

export default function Hero({ query, setQuery, next, now, onOpen, onSearch }) {
  const live = next && now >= next.startMs;
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={15} /> EVENTS WORTH THE JOURNEY</div>
        <h1>Find your next<br /><span>reason to move.</span></h1>
        <p>Sports, adventures, music nights, culture, food and everything in between — experience the world, one event at a time.</p>
        <form className="hero-search" onSubmit={(e) => { e.preventDefault(); onSearch(); }}>
          <Search size={19} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, cities, experiences..." aria-label="Search events" />
          <button className="hero-go" type="submit">Search</button>
        </form>
        <div className="hero-meta"><span><MapPin size={15} /> Everywhere</span><span><Compass size={15} /> All experiences</span><span><Clock3 size={15} /> Anytime</span></div>
      </div>
      <div className="hero-art">
        <div className="art-card">
          <span className="art-label">{next ? (live ? "HAPPENING NOW" : "NEXT ADVENTURE") : "NEXT ADVENTURE"}</span>
          {next ? (
            <>
              <strong>{next.title}</strong>
              <small><MapPin size={12} /> {next.city || next.location} · {next.category}</small>
              <Countdown target={live ? next.endMs : next.startMs} dark />
              <div className="art-row"><span><Clock3 size={13} /> Runs {durationText(next)}</span><span>{rangeText(next)}</span></div>
              <button className="art-circle" onClick={() => onOpen(next)} aria-label={`Open ${next.title}`}>↗</button>
            </>
          ) : (
            <strong>ALPINE<br />ENERGY</strong>
          )}
        </div>
      </div>
    </section>
  );
}
