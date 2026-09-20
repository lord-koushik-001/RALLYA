import { useEffect, useState } from "react";
import { cacheGet, cacheSet, fetchJSON } from "./cache.js";

// Free weather + snow data from Open-Meteo (no API key).
const HALF_HOUR = 30 * 60 * 1000;

export async function getWeather(lat, lng) {
  const key = `wx:${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const url = "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lng}&timezone=Europe%2FParis&forecast_days=16` +
    "&current=temperature_2m,weather_code,wind_speed_10m,snow_depth" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum";
  const d = await fetchJSON(url, {}, 12000);
  const out = {
    current: d.current ? { temp: d.current.temperature_2m, code: d.current.weather_code, wind: d.current.wind_speed_10m, snowDepthCm: typeof d.current.snow_depth === "number" ? Math.round(d.current.snow_depth * 100) : null } : null,
    days: (d.daily?.time || []).map((date, i) => ({ date, code: d.daily.weather_code[i], max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i], rain: d.daily.precipitation_sum[i], snow: d.daily.snowfall_sum[i] })),
  };
  cacheSet(key, out, HALF_HOUR);
  return out;
}

export function useWeather(lat, lng) {
  const [state, setState] = useState({ loading: true, data: null, error: false });
  useEffect(() => {
    let live = true;
    if (typeof lat !== "number" || typeof lng !== "number") { setState({ loading: false, data: null, error: true }); return undefined; }
    setState({ loading: true, data: null, error: false });
    getWeather(lat, lng).then((data) => live && setState({ loading: false, data, error: false })).catch(() => live && setState({ loading: false, data: null, error: true }));
    return () => { live = false; };
  }, [lat, lng]);
  return state;
}

/** WMO weather code -> label + icon key. */
export function describe(code) {
  if (code === 0) return { label: "Clear", icon: "sun" };
  if (code <= 2) return { label: "Partly cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "rain" };
  if (code >= 61 && code <= 67) return { label: "Rain", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Showers", icon: "rain" };
  if (code === 85 || code === 86) return { label: "Snow showers", icon: "snow" };
  if (code >= 95) return { label: "Thunderstorm", icon: "storm" };
  return { label: "Mixed", icon: "cloud" };
}
