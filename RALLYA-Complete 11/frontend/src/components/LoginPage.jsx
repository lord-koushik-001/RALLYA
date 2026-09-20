import React, { useState } from "react";
import { Eye, EyeOff, Bookmark, Ticket, CalendarPlus, Info } from "lucide-react";
import Art from "../lib/Art.jsx";
import { auth, isDemo } from "../lib/api.js";

export default function LoginPage({ initialMode = "login", ready, onAuth, go }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const register = mode === "register";

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (register && form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const user = register ? await auth.register(form) : await auth.login(form);
      onAuth(user, register);
    } catch (err) {
      setError(err.validation ? err.message : "Couldn't reach the server. Please try again.");
    } finally { setBusy(false); }
  }

  const perks = [[Bookmark, "Your plan follows you", "Saved events sync to your account on every device."], [CalendarPlus, "Add your own events", "Create listings and manage the ones you added."], [Ticket, "Reserve in one tap", "Keep your reservations and tickets in one place."]];

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <aside className="auth-side">
          <Art kind="snow" id="login-art" />
          <div className="auth-side-in">
            <div className="brand light"><span className="brand-mark alt">R</span>RALLYA<span className="brand-dot">.</span></div>
            <h2>Events worth<br />the journey.</h2>
            <ul>{perks.map(([I, t, d]) => <li key={t}><span><I size={17} /></span><div><b>{t}</b><small>{d}</small></div></li>)}</ul>
          </div>
        </aside>
        <div className="auth-main">
          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={!register} className={!register ? "on" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button role="tab" aria-selected={register} className={register ? "on" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>
          <h1>{register ? "Join RALLYA" : "Welcome back"}</h1>
          <p className="muted">{register ? "Create a free account to save your plan and add events." : "Sign in to see your plan and manage your events."}</p>

          <form onSubmit={submit} className="auth-form" noValidate>
            {register && <label>Full name<input name="name" autoComplete="name" value={form.name} onChange={change} placeholder="Koushik Venkatesan" required /></label>}
            <label>Email<input name="email" type="email" autoComplete="email" value={form.email} onChange={change} placeholder="you@example.com" required /></label>
            <label>Password
              <span className="pw">
                <input name="password" type={show ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} value={form.password} onChange={change} placeholder={register ? "At least 8 characters" : "Your password"} required />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary red wide" disabled={busy || !ready}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
          </form>

          <button className="text-button center" onClick={() => go("discover")}>Continue as guest</button>
          {ready && isDemo() && <p className="note"><Info size={15} /> Demo mode: accounts are stored in this browser only. Start the backend for real accounts.</p>}
        </div>
      </div>
    </section>
  );
}
