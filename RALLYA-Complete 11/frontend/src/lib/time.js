// All event times are treated as France time (Europe/Paris), whatever the viewer's timezone.
export const PARIS = "Europe/Paris";
export const pad = (n) => String(n).padStart(2, "0");

function lastSunday(year, monthIndex) {
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
}

/** "YYYY-MM-DD" + "HH:MM" in Paris time -> UTC milliseconds (handles summer/winter time). */
export function parisMs(dateStr, time = "00:00") {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [H, M] = time.split(":").map(Number);
  const local = Date.UTC(y, mo - 1, d, H, M);
  const dstStart = Date.UTC(y, 2, lastSunday(y, 2), 1);
  const dstEnd = Date.UTC(y, 9, lastSunday(y, 9), 1);
  const guess = local - 36e5;
  const offset = guess >= dstStart && guess < dstEnd ? 2 : 1;
  return local - offset * 36e5;
}

const f = (opts, locale = "en-US") => (ms) => new Intl.DateTimeFormat(locale, { ...opts, timeZone: PARIS }).format(ms);
export const fmtDay = f({ month: "short", day: "numeric", year: "numeric" });
export const fmtShort = f({ month: "short", day: "numeric" });
export const fmtTime = f({ hour: "2-digit", minute: "2-digit", hour12: false }, "en-GB");
export const todayISO = (now = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: PARIS }).format(now);
export const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export const daysBetween = (a, b) => Math.round((parisMs(b, "12:00") - parisMs(a, "12:00")) / 864e5);

/** Adds startMs / endMs / end defaults to a raw event. */
export function withTimes(e) {
  const end = e.end || e.date;
  return {
    ...e,
    end,
    tags: e.tags || [],
    highlights: e.highlights || [],
    startMs: parisMs(e.date, e.time || "10:00"),
    endMs: parisMs(end, e.endTime || "23:59"),
  };
}

export function durationText(e) {
  if (e.dur) return e.dur;
  const n = daysBetween(e.date, e.end) + 1;
  return `${n} day${n > 1 ? "s" : ""}`;
}

export const rangeText = (e) =>
  e.date === e.end ? fmtDay(e.startMs) : `${fmtShort(e.startMs)} – ${fmtDay(e.endMs)}`;

export function statusOf(e, now) {
  if (now > e.endMs) return { key: "ended", text: "Ended" };
  if (now >= e.startMs) return { key: "live", text: "Live now" };
  const ms = e.startMs - now;
  const d = Math.floor(ms / 864e5);
  if (d >= 2) return { key: "soon", text: `In ${d} days` };
  if (d === 1) return { key: "soon", text: "Tomorrow" };
  return { key: "soon", text: `In ${Math.max(1, Math.floor(ms / 36e5))}h` };
}

export function splitMs(ms) {
  let s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return { d, h, m, s };
}

/** Builds a downloadable .ics calendar file for an event. */
export function makeICS(e) {
  const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RALLYA//Events//EN", "BEGIN:VEVENT",
    `UID:${e.id}@rallya`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(e.startMs)}`, `DTEND:${utc(e.endMs)}`,
    `SUMMARY:${esc(e.title)}`, `LOCATION:${esc([e.venue, e.location].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(e.description)}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
