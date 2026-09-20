import { parisMs, daysBetween, todayISO } from "./time.js";

export function withResortTimes(r) {
  return {
    ...r,
    openMs: parisMs(r.open, "08:30"),
    closeMs: parisMs(r.close, "16:30"),
    length: daysBetween(r.open, r.close) + 1,
  };
}

export function resortState(r, now) {
  if (now < r.openMs) {
    const d = Math.ceil((r.openMs - now) / 864e5);
    return { key: "soon", text: `Opens in ${d} day${d === 1 ? "" : "s"}`, pct: 0, sub: `${r.length} days` };
  }
  if (now <= r.closeMs) {
    const day = daysBetween(r.open, todayISO(now)) + 1;
    return { key: "open", text: "Open now", pct: Math.round(((now - r.openMs) / (r.closeMs - r.openMs)) * 100), sub: `Day ${day} of ${r.length}` };
  }
  return { key: "done", text: "Season ended", pct: 100, sub: `${r.length} days` };
}

/** What the big Alps countdown should point at. */
export function seasonFocus(resorts, now) {
  const next = resorts.filter((r) => r.openMs > now).sort((a, b) => a.openMs - b.openMs)[0];
  if (next) return { label: "Next resort opening", title: next.name, sub: `Opens ${new Date(next.openMs).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Europe/Paris" })} · season runs ${next.length} days`, target: next.openMs };
  const open = resorts.filter((r) => r.openMs <= now && r.closeMs >= now).sort((a, b) => a.closeMs - b.closeMs);
  if (open.length) return { label: "Season in progress", title: `${open.length} resort${open.length > 1 ? "s" : ""} open`, sub: `First closing: ${open[0].name}`, target: open[0].closeMs };
  return { label: "Season", title: "See you next winter", sub: "This season has ended.", target: null };
}
