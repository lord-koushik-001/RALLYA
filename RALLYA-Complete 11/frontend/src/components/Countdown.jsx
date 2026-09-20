import React, { useEffect, useState } from "react";
import { splitMs, pad } from "../lib/time.js";

// Ticks every second on its own so the rest of the page doesn't re-render.
export default function Countdown({ target, dark = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { d, h, m, s } = splitMs(target - now);
  const tiles = [["Days", d], ["Hours", h], ["Min", m], ["Sec", s]];
  return (
    <div className={dark ? "cd dark" : "cd"} role="timer" aria-label={`${d} days ${h} hours ${m} minutes ${s} seconds`}>
      {tiles.map(([label, v]) => <div className="cd-tile" key={label}><b>{pad(v)}</b><span>{label}</span></div>)}
    </div>
  );
}
