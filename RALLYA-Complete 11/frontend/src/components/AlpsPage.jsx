import React from "react";
import { Mountain, CalendarDays, Flag, Info } from "lucide-react";
import Countdown from "./Countdown.jsx";
import EventCard from "./EventCard.jsx";
import WeatherCard from "./WeatherCard.jsx";
import EventImage from "./EventImage.jsx";
import { fmtDay } from "../lib/time.js";
import { resortState, seasonFocus } from "../lib/alps.js";

export default function AlpsPage({ resorts, events, now, saved, onSave, onOpen, go }) {
  const focus = seasonFocus(resorts, now);
  const alpsEvents = events.filter((e) => e.region === "Alps" && e.endMs >= now).sort((a, b) => a.startMs - b.startMs);
  const avg = resorts.length ? Math.round(resorts.reduce((s, r) => s + r.length, 0) / resorts.length) : 0;
  return (
    <section className="section page-section">
      <div className="eyebrow">FRENCH ALPS · SNOWBOARDING</div>
      <h1>The Alpine snow season, day by day</h1>
      <p className="muted">Track when each resort opens, how long the season runs, the conditions on the mountain right now, and which snowboard events land there.</p>

      <div className="alps-hero">
        <div className="alps-visual">
          <div className="eyebrow light">{focus.label}</div>
          <h2>{focus.title}</h2>
          <p>{focus.sub}</p>
          {focus.target && <Countdown target={focus.target} dark />}
        </div>
        <div className="alps-facts">
          <div className="fact"><span className="fact-ico"><Mountain size={20} /></span><div><b>{resorts.length}</b><span>Resorts tracked</span></div></div>
          <div className="fact"><span className="fact-ico"><CalendarDays size={20} /></span><div><b>{avg} days</b><span>Average season length</span></div></div>
          <div className="fact"><span className="fact-ico"><Flag size={20} /></span><div><b>{alpsEvents.length} upcoming</b><span>Alpine events</span></div></div>
        </div>
      </div>

      <div className="resort-grid">
        {resorts.map((r) => {
          const s = resortState(r, now);
          return (
            <article className="resort" key={r.id}>
              <EventImage e={{ id: `resort-${r.id}`, city: r.wiki || r.name, kind: "snow" }} className="resort-photo" />
              <header>
                <div><h3>{r.name}</h3><span className="alt"><Mountain size={13} /> {r.altitude.toLocaleString("en-US")} m village</span></div>
                <span className={`badge badge-${s.key}`}>{s.text}</span>
              </header>
              {typeof r.lat === "number" && <WeatherCard lat={r.lat} lng={r.lng} compact />}
              <div className="bar" role="progressbar" aria-valuenow={s.pct} aria-valuemin="0" aria-valuemax="100"><div style={{ width: `${s.pct}%` }} /></div>
              <div className="resort-dates"><span>Opens <b>{fmtDay(r.openMs)}</b></span><span>Closes <b>{fmtDay(r.closeMs)}</b></span></div>
              <div className="resort-dates"><span>Season length <b>{r.length} days</b></span><span>{s.sub}</span></div>
              <div className="tag-row">{r.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
              <button className="text-button" onClick={() => go("places", r.wiki || r.name)}>Eat & stay in {r.name}</button>
            </article>
          );
        })}
      </div>
      <p className="note"><Info size={15} /> Opening and closing dates are indicative and depend on snow conditions. Weather and snow depth come from Open-Meteo and are model data, so confirm with the resort before you travel.</p>

      <div className="section-head sub-head"><div><div className="eyebrow">ON THE MOUNTAIN</div><h2>Alpine events</h2></div><span className="muted">{alpsEvents.length} events</span></div>
      <div className="event-grid">
        {alpsEvents.map((e) => <EventCard key={e.id} e={e} now={now} saved={saved.includes(e.id)} onSave={() => onSave(e.id)} onOpen={() => onOpen(e)} />)}
      </div>
    </section>
  );
}
