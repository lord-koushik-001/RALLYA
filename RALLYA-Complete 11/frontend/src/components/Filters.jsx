import React from "react";
import { Search, RotateCcw } from "lucide-react";

export default function Filters({ F, set, categories, regions, collections, count, reset, savedCount }) {
  return (
    <div className="filters">
      <div className="category-row">
        {categories.map((c) => (
          <button key={c} className={F.category === c ? "category active" : "category"} onClick={() => set({ category: c })}>{c}</button>
        ))}
      </div>
      <div className="collection-row">
        <span className="muted small">Collections</span>
        {collections.map((c) => (
          <button key={c.key} className={F.collection === c.key ? "chip active" : "chip"} onClick={() => set({ collection: F.collection === c.key ? "" : c.key })}>{c.label}</button>
        ))}
      </div>
      <div className="filter-panel">
        <label className="field grow"><span>Search</span>
          <div className="input-icon"><Search size={16} /><input value={F.query} onChange={(e) => set({ query: e.target.value })} placeholder="Event, city or venue" /></div>
        </label>
        <label className="field"><span>Region</span>
          <select value={F.region} onChange={(e) => set({ region: e.target.value })}>
            <option value="All">All France</option>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="field"><span>From date</span><input type="date" value={F.from} onChange={(e) => set({ from: e.target.value })} /></label>
        <label className="field"><span>Sort by</span>
          <select value={F.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="date">Soonest first</option><option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="filter-foot">
        <span className="muted">{count} event{count === 1 ? "" : "s"} found</span>
        <span className="filter-actions">
          <label className="switch"><input type="checkbox" checked={F.savedOnly} onChange={(e) => set({ savedOnly: e.target.checked })} /> Saved only ({savedCount})</label>
          <button className="text-button" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </span>
      </div>
    </div>
  );
}
