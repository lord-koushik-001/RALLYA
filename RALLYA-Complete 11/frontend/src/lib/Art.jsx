import React from "react";

// Generated artwork used when an event has no photo (or its photo fails to load).
// Colours follow the RALLYA palette: navy, sky blue and signal red.
function rng(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export default function Art({ kind = "city", id = "art" }) {
  const r = rng(`${kind}-${id}`);
  const u = `${kind}${id}`.replace(/[^a-z0-9]/gi, "");
  const grad = (a, b) => (
    <>
      <defs>
        <linearGradient id={`g${u}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#g${u})`} />
    </>
  );
  let body;

  if (kind === "snow") {
    body = (
      <>
        {grad("#10243b", "#8fd3f4")}
        <circle cx={270 + r() * 90} cy="54" r="20" fill="#ef4b45" />
        <path d="M-10 190 L80 80 L140 140 L210 50 L290 150 L350 95 L420 170 V240 H-10Z" fill="#f4fbff" />
        <path d="M-10 225 L90 165 L200 210 L300 160 L420 215 V240 H-10Z" fill="#bce8ff" />
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={r() * 400} cy={r() * 200} r={1 + r() * 1.8} fill="#fff" opacity=".8" />)}
      </>
    );
  } else if (kind === "dj") {
    body = (
      <>
        {grad("#10243b", "#236b91")}
        <circle cx="200" cy="112" r="72" fill="none" stroke="#bce8ff" strokeOpacity=".3" strokeWidth="2" />
        <circle cx="200" cy="112" r="46" fill="none" stroke="#bce8ff" strokeOpacity=".5" strokeWidth="2" />
        <circle cx="200" cy="112" r="14" fill="#ef4b45" />
        {Array.from({ length: 26 }, (_, i) => { const h = 20 + r() * 90; return <rect key={i} x={12 + i * 15} y={240 - h} width="9" height={h} rx="3" fill={i % 3 ? "#bce8ff" : "#ef4b45"} opacity=".85" />; })}
      </>
    );
  } else if (kind === "culture") {
    body = (
      <>
        {grad("#10243b", "#b8433f")}
        {Array.from({ length: 9 }, (_, i) => { const x = 30 + i * 42 + r() * 10, y = 40 + r() * 90, rad = 13 + r() * 8; return (
          <g key={i}><line x1={x} y1="0" x2={x} y2={y - 10} stroke="#ffd9d6" strokeOpacity=".5" /><circle cx={x} cy={y} r={rad + 10} fill="#ffd9d6" opacity=".16" /><circle cx={x} cy={y} r={rad} fill="#ffe4e1" opacity=".95" /></g>
        ); })}
        <path d="M0 240 V190 Q50 150 100 190 V240Z M120 240 V180 Q180 130 240 180 V240Z M260 240 V195 Q310 155 360 195 V240Z" fill="#0b1a2c" opacity=".85" />
      </>
    );
  } else if (kind === "travel") {
    body = (
      <>
        {grad("#dff5ff", "#7fc4e6")}
        <circle cx="200" cy="112" r="34" fill="#ef4b45" opacity=".95" />
        <path d="M-10 170 Q90 120 200 165 T420 150 V240 H-10Z" fill="#236b91" />
        <path d="M-10 205 Q110 165 220 200 T420 190 V240 H-10Z" fill="#10243b" />
        {Array.from({ length: 14 }, (_, i) => <rect key={i} x={10 + i * 29} y={196 + r() * 10} width="4" height="34" fill="#bce8ff" opacity=".8" />)}
      </>
    );
  } else if (kind === "sea") {
    body = (
      <>
        {grad("#ffb199", "#236b91")}
        <circle cx="200" cy="150" r="46" fill="#fff4e8" />
        <rect y="150" width="400" height="90" fill="#10243b" />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${165 + i * 13} Q50 ${157 + i * 13} 100 ${165 + i * 13} T200 ${165 + i * 13} T300 ${165 + i * 13} T400 ${165 + i * 13}`} fill="none" stroke="#bce8ff" strokeOpacity={0.6 - i * 0.08} strokeWidth="2" />)}
      </>
    );
  } else if (kind === "food") {
    body = (
      <>
        {grad("#fff1e6", "#f7b99a")}
        <circle cx="200" cy="125" r="78" fill="#fff" />
        <circle cx="200" cy="125" r="58" fill="none" stroke="#bce8ff" strokeWidth="3" />
        <circle cx="200" cy="125" r="34" fill="#ef4b45" opacity=".9" />
        {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={178 + r() * 44} cy={104 + r() * 42} r={3 + r() * 4} fill="#10243b" opacity=".55" />)}
        <path d="M70 60 V190 M62 60 V100 M78 60 V100" stroke="#10243b" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M330 60 Q352 100 330 130 V190" stroke="#10243b" strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    );
  } else if (kind === "bar") {
    body = (
      <>
        {grad("#10243b", "#3a2a5c")}
        {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={r() * 400} cy={r() * 240} r={1 + r() * 2.5} fill={i % 2 ? "#ef4b45" : "#bce8ff"} opacity=".55" />)}
        <path d="M150 60 H250 L200 130 Z" fill="none" stroke="#bce8ff" strokeWidth="4" strokeLinejoin="round" />
        <path d="M200 130 V190 M165 190 H235" stroke="#bce8ff" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="228" cy="72" r="9" fill="#ef4b45" />
        <path d="M0 240 V215 H400 V240Z" fill="#0b1a2c" />
      </>
    );
  } else if (kind === "stay") {
    body = (
      <>
        {grad("#bce8ff", "#dff5ff")}
        <path d="M-10 240 L120 150 L230 215 L330 135 L420 200 V240Z" fill="#8fd3f4" opacity=".7" />
        <path d="M110 200 V120 L200 60 L290 120 V200Z" fill="#10243b" />
        <path d="M95 125 L200 50 L305 125" fill="none" stroke="#ef4b45" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="178" y="145" width="44" height="55" rx="4" fill="#bce8ff" />
        <rect x="128" y="138" width="30" height="26" rx="3" fill="#f4fbff" opacity=".9" /><rect x="242" y="138" width="30" height="26" rx="3" fill="#f4fbff" opacity=".9" />
      </>
    );
  } else if (kind === "adventure") {
    body = (
      <>
        {grad("#bce8ff", "#1684b8")}
        <circle cx="90" cy="60" r="22" fill="#fff" opacity=".9" />
        <path d="M-10 200 L70 110 L130 170 L220 60 L310 175 L360 120 L420 190 V240 H-10Z" fill="#10243b" />
        <path d="M220 60 L192 96 L214 88 L226 104 L240 86 L252 96Z" fill="#f4fbff" />
        <path d="M-10 240 L60 200 L160 235 L250 205 L420 240Z" fill="#ef4b45" opacity=".9" />
      </>
    );
  } else {
    let x = 0;
    const blocks = [];
    while (x < 400) {
      const w = 18 + r() * 26, h = 50 + r() * 110;
      blocks.push(<rect key={`b${x}`} x={x} y={240 - h} width={w} height={h} fill="#10243b" opacity=".92" />);
      for (let k = 0; k < 4; k++) blocks.push(<rect key={`w${x}${k}`} x={x + 4 + r() * (w - 10)} y={240 - h + 8 + r() * (h - 20)} width="3" height="3" fill="#bce8ff" opacity=".85" />);
      x += w + 3;
    }
    body = (<>{grad("#bce8ff", "#5fb1d6")}<circle cx="320" cy="60" r="22" fill="#ef4b45" />{blocks}</>);
  }

  return <svg className="art" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{body}</svg>;
}
