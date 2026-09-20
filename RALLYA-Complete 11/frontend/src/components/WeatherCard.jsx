import React from "react";
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudFog, CloudLightning, Wind, Snowflake } from "lucide-react";
import { useWeather, describe } from "../lib/weather.js";
import { fmtShort, parisMs } from "../lib/time.js";

const ICONS = { sun: Sun, "cloud-sun": CloudSun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, fog: CloudFog, storm: CloudLightning };
const Icon = ({ code, size = 18 }) => { const I = ICONS[describe(code).icon] || Cloud; return <I size={size} />; };

/** Live conditions plus the forecast for an event's dates (Open-Meteo gives ~16 days ahead). */
export default function WeatherCard({ lat, lng, event, compact = false }) {
  const { loading, data, error } = useWeather(lat, lng);
  if (loading) return <div className="weather muted small">Checking the weather…</div>;
  if (error || !data) return <div className="weather muted small">Weather isn't available right now.</div>;
  const c = data.current;
  const days = event ? data.days.filter((d) => d.date >= event.date && d.date <= event.end).slice(0, 7) : [];
  return (
    <div className="weather">
      {c && (
        <div className="wx-now">
          <span className="wx-icon"><Icon code={c.code} size={22} /></span>
          <div><b>{Math.round(c.temp)}°C</b> <span>{describe(c.code).label}</span></div>
          <span className="wx-meta"><Wind size={13} /> {Math.round(c.wind)} km/h</span>
          {c.snowDepthCm > 0 && <span className="wx-meta"><Snowflake size={13} /> {c.snowDepthCm} cm snow</span>}
          <small>right now</small>
        </div>
      )}
      {!compact && event && (days.length > 0 ? (
        <div className="wx-days">
          {days.map((d) => (
            <div className="wx-day" key={d.date}>
              <small>{fmtShort(parisMs(d.date, "12:00"))}</small>
              <Icon code={d.code} size={17} />
              <b>{Math.round(d.max)}°</b><span>{Math.round(d.min)}°</span>
              {d.snow > 0 ? <em>{d.snow.toFixed(1)} cm ❄</em> : d.rain > 0 ? <em>{d.rain.toFixed(1)} mm</em> : <em>dry</em>}
            </div>
          ))}
        </div>
      ) : <p className="muted small wx-note">The day-by-day forecast for this event appears about 16 days before it starts.</p>)}
    </div>
  );
}
