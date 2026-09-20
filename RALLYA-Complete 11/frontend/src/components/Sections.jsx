import React, { useState } from "react";
import { ChevronRight, Mail, Phone, MapPin, Snowflake, ArrowRight } from "lucide-react";
import Art from "../lib/Art.jsx";
import Countdown from "./Countdown.jsx";
import { daysBetween, todayISO, fmtShort } from "../lib/time.js";
import { seasonFocus } from "../lib/alps.js";
import { subscribe } from "../lib/api.js";

const CAT_KIND = { Sports: "city", Adventure: "adventure", Travel: "travel", "DJ & Music": "dj", Culture: "culture" };

export function Categories({ categories, events, now, onPick }) {
  return (
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">BROWSE BY VIBE</div><h2>Pick your kind of event</h2></div></div>
      <div className="cat-tiles">
        {categories.filter((c) => c !== "All").map((c) => {
          const n = events.filter((e) => e.category === c && e.endMs >= now).length;
          return (
            <button className="cat-tile" key={c} onClick={() => onPick(c)}>
              <Art kind={CAT_KIND[c]} id={`tile-${c}`} />
              <span className="cat-tile-in"><b>{c}</b><small>{n} upcoming</small></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ComingUp({ events, now, onOpen }) {
  const list = events.filter((e) => e.endMs >= now).sort((a, b) => a.startMs - b.startMs).slice(0, 4);
  return (
    <section className="section split-section">
      <div><div className="eyebrow">DON'T MISS OUT</div><h2>What's coming up</h2><p className="muted">Keep an eye on the experiences that are getting closer.</p></div>
      <div className="mini-list">
        {list.map((e) => {
          const d = daysBetween(todayISO(now), e.date);
          return (
            <button className="mini-event" key={e.id} onClick={() => onOpen(e)}>
              <div className="date-tile"><b>{fmtShort(e.startMs).split(" ")[1]}</b><span>{fmtShort(e.startMs).split(" ")[0]}</span></div>
              <div><b>{e.title}</b><span>{e.location}</span></div>
              <span className="days">{d <= 0 ? "Live" : `${d}d`}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AlpsTeaser({ resorts, now, alpsCount, onGo }) {
  const focus = seasonFocus(resorts, now);
  return (
    <section className="section">
      <div className="alps-band">
        <div className="alps-band-copy">
          <div className="eyebrow light"><Snowflake size={15} /> FRENCH ALPS · SNOWBOARDING</div>
          <h2>{focus.label}: <span>{focus.title}</span></h2>
          <p>{focus.sub}. {alpsCount} snowboard, freeride and mountain events are lined up across the Alps.</p>
          <button className="primary light" onClick={onGo}>See the snow season <ArrowRight size={16} /></button>
        </div>
        {focus.target && <Countdown target={focus.target} dark />}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    ["1", "Discover", "Filter by category, region and date to see what's happening — from a one-night warehouse set to a week in the Alps."],
    ["2", "Count down", "Every event has a live timer, its duration and end date, so you always know how long you have."],
    ["3", "Save & go", "Save events to your plan, add them to your calendar and grab tickets when you're ready."],
  ];
  return (
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">SIMPLE BY DESIGN</div><h2>How RALLYA works</h2></div></div>
      <div className="how">{steps.map(([n, t, p]) => <div className="how-step" key={n}><span className="how-n">{n}</span><h3>{t}</h3><p>{p}</p></div>)}</div>
    </section>
  );
}

export function Newsletter({ toast }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(ev) {
    ev.preventDefault();
    setBusy(true);
    try { await subscribe(email.trim()); setEmail(""); toast("You're on the list — welcome!"); }
    catch (err) { toast(err.validation ? err.message : "Couldn't subscribe right now. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <section className="section">
      <div className="cta">
        <div className="eyebrow light">NEVER MISS A DATE</div>
        <h2>The best events in France, in your inbox.</h2>
        <p>One short email a week: new alpine sessions, DJ line-ups and festival dates — with days-to-go for each.</p>
        <form className="news" onSubmit={submit}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" aria-label="Email address" />
          <button className="primary red" disabled={busy}>{busy ? "Subscribing..." : "Subscribe"}</button>
        </form>
      </div>
    </section>
  );
}

export function Footer({ go }) {
  return (
    <footer className="site-footer">
      <div className="foot-grid">
        <div>
          <div className="brand"><span className="brand-mark">R</span>RALLYA<span className="brand-dot">.</span></div>
          <p className="muted">Move toward something memorable. Sports, alpine adventures, travel, DJ nights and culture across France.</p>
        </div>
        <div><h4>Explore</h4><ul>
          <li><button onClick={() => go("discover")}>Discover</button></li>
          <li><button onClick={() => go("alps")}>Alps season</button></li>
          <li><button onClick={() => go("places")}>Eat & stay</button></li>
          <li><button onClick={() => go("map")}>Map</button></li>
          <li><button onClick={() => go("calendar")}>Calendar</button></li>
          <li><button onClick={() => go("plan")}>My plan</button></li></ul></div>
        <div><h4>Company</h4><ul><li><span>About RALLYA</span></li><li><span>List your event</span></li><li><span>Partner with us</span></li></ul></div>
        <div><h4>Contact</h4><ul>
          <li><Mail size={14} /> hello@rallya.example</li>
          <li><Phone size={14} /> +33 1 23 45 67 89</li>
          <li><MapPin size={14} /> Paris, France</li></ul></div>
      </div>
      <div className="foot-bottom"><span>© 2026 RALLYA</span><span>Event listings are sample data — replace with verified feeds before launch.</span></div>
    </footer>
  );
}
