import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Interactive map: OpenStreetMap tiles via Leaflet (no API key).
// focus: { id, n } — change n to re-focus the same marker.
// markers: [{ id, kind: "event" | "resort" | "place", lat, lng, title, subtitle, actionLabel }]
export default function MapView({ markers, height = 420, focus, onSelect, className = "" }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const registry = useRef(new Map());
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (mapRef.current || !elRef.current) return undefined;
    const map = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([46.6, 2.5], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(map);
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    registry.current = new Map();
    const pts = [];
    markers.forEach((m) => {
      if (typeof m.lat !== "number" || typeof m.lng !== "number") return;
      const icon = L.divIcon({ className: "pin-wrap", html: `<span class="pin pin-${m.kind}"></span>`, iconSize: [26, 34], iconAnchor: [13, 32], popupAnchor: [0, -30] });
      const marker = L.marker([m.lat, m.lng], { icon, title: m.title, keyboard: true });
      const box = document.createElement("div");
      box.className = "map-pop";
      const b = document.createElement("b"); b.textContent = m.title; box.appendChild(b);
      if (m.subtitle) { const s = document.createElement("span"); s.textContent = m.subtitle; box.appendChild(s); }
      if (m.actionLabel) {
        const btn = document.createElement("button"); btn.type = "button"; btn.textContent = m.actionLabel;
        btn.addEventListener("click", () => selectRef.current && selectRef.current(m));
        box.appendChild(btn);
      }
      marker.bindPopup(box);
      marker.addTo(layer);
      registry.current.set(m.id, marker);
      pts.push([m.lat, m.lng]);
    });
    const size = map.getSize();
    if (pts.length && size.x > 0 && size.y > 0) {
      if (pts.length === 1) map.setView(pts[0], 12);
      else map.fitBounds(L.latLngBounds(pts), { padding: [34, 34], maxZoom: 12 });
    } else if (pts.length === 1) map.setView(pts[0], 12);
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = focus && registry.current.get(focus.id);
    if (map && marker) { map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 11), { duration: 0.6 }); marker.openPopup(); }
  }, [focus]);

  // Leaflet needs a resize nudge when its container appears/changes size.
  useEffect(() => { const t = setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 200); return () => clearTimeout(t); }, [height]);

  return <div className={`map-box ${className}`} style={{ height }} ref={elRef} role="region" aria-label="Map" />;
}
