import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isoOf, todayISO, statusOf } from "../lib/time.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage({ events, now, onOpen }) {
  const t = todayISO(now).split("-").map(Number);
  const [cur, setCur] = useState({ y: t[0], m: t[1] - 1 });
  const { y, m } = cur;
  const first = new Date(y, m, 1).getDay();
  const count = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: first + count }, (_, i) => (i < first ? null : i - first + 1));
  const today = todayISO(now);
  const move = (n) => { const d = new Date(y, m + n, 1); setCur({ y: d.getFullYear(), m: d.getMonth() }); };
  const monthStart = isoOf(y, m, 1), monthEnd = isoOf(y, m, count);
  const inMonth = events.filter((e) => e.date <= monthEnd && e.end >= monthStart).sort((a, b) => a.startMs - b.startMs);

  return (
    <section className="section page-section">
      <div className="eyebrow">PLAN AHEAD</div>
      <h1>Event calendar</h1>
      <p className="muted">See what's happening and open an event for more details. Multi-day events span every day they run.</p>
      <div className="calendar-head">
        <button className="secondary" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
        <h2>{new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
        <div className="cal-head-right">
          <button className="secondary" onClick={() => setCur({ y: t[0], m: t[1] - 1 })}>Today</button>
          <button className="secondary" onClick={() => move(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="calendar-grid">
        {DAYS.map((d) => <b className="weekday" key={d}>{d}</b>)}
        {cells.map((day, i) => {
          if (!day) return <div className="calendar-day blank" key={i} />;
          const iso = isoOf(y, m, day);
          const match = events.filter((e) => e.date <= iso && e.end >= iso);
          const cls = ["calendar-day", match.length ? "has-event" : "", iso === today ? "is-today" : ""].join(" ").trim();
          return (
            <div className={cls} key={i}>
              <span className="day-num">{day}</span>
              {match.slice(0, 2).map((e) => (
                <button key={e.id} className={e.date === iso ? "" : "cont"} onClick={() => onOpen(e)} title={e.title}>{e.date === iso ? e.title : `↳ ${e.title}`}</button>
              ))}
              {match.length > 2 && <em className="more">+{match.length - 2} more</em>}
            </div>
          );
        })}
      </div>

      <div className="section-head sub-head"><div><div className="eyebrow">THIS MONTH</div><h2>{inMonth.length ? `${inMonth.length} event${inMonth.length > 1 ? "s" : ""}` : "Nothing scheduled"}</h2></div></div>
      <div className="mini-list wide">
        {inMonth.map((e) => (
          <button className="mini-event" key={e.id} onClick={() => onOpen(e)}>
            <div className="date-tile"><b>{e.date.slice(8)}</b><span>{new Date(y, m, 1).toLocaleDateString("en-US", { month: "short" })}</span></div>
            <div><b>{e.title}</b><span>{e.location} · {e.category}</span></div>
            <span className="days">{statusOf(e, now).text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
