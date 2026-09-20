import React, { useEffect, useRef, useState } from "react";
import { Plus, Menu, X, LogOut, Bookmark, LogIn } from "lucide-react";

const NAV = [["discover", "Discover"], ["alps", "Alps season"], ["places", "Eat & stay"], ["map", "Map"], ["calendar", "Calendar"], ["plan", "My plan"]];

const initials = (name = "") => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export default function Header({ page, go, onAdd, savedCount, mobileNav, setMobileNav, user, onLogout }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  return (
    <header className="topbar">
      <div className="brand" onClick={() => go("discover")} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go("discover")}>
        <span className="brand-mark">R</span><span>RALLYA<span className="brand-dot">.</span></span>
      </div>
      <nav className={mobileNav ? "nav open" : "nav"} aria-label="Main">
        {NAV.map(([key, label]) => (
          <button key={key} className={page === key ? "nav-link active" : "nav-link"} onClick={() => { go(key); setMobileNav(false); }}>
            {label}{key === "plan" && savedCount > 0 && <span className="count-badge">{savedCount}</span>}
          </button>
        ))}
      </nav>
      <div className="top-actions">
        <button className="icon-button" onClick={onAdd} title="Add event" aria-label="Add event"><Plus size={18} /></button>
        {user ? (
          <div className="user-menu" ref={ref}>
            <button className="profile" onClick={() => setMenu(!menu)} aria-label="Account menu" aria-expanded={menu}>{initials(user.name)}</button>
            {menu && (
              <div className="dropdown" role="menu">
                <div className="dropdown-head"><b>{user.name}</b><small>{user.email}</small></div>
                <button role="menuitem" onClick={() => { setMenu(false); go("plan"); }}><Bookmark size={15} /> My plan</button>
                <button role="menuitem" onClick={() => { setMenu(false); onLogout(); }}><LogOut size={15} /> Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <button className="signin-button" onClick={() => go("login")}><LogIn size={15} /> Sign in</button>
        )}
        <button className="menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">{mobileNav ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </header>
  );
}
