import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* ── Desktop / top navbar ── */}
      <nav className="navbar">
        <Link to="/feed" className="navbar-brand">SocioSpace</Link>

        <div className="navbar-links">
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/drafts">Drafts</NavLink>
          <NavLink to="/messages">Messages</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NotificationBell />
        </div>

        {/* Desktop: full searchbar */}
        <SearchBar />

        {/* Mobile: search icon (visible only on mobile via CSS) */}
        <div className="navbar-mobile-search">
          <button
            className="navbar-search-btn"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
          >
            <span className="material-icons-round">
              {searchOpen ? "close" : "search"}
            </span>
          </button>
        </div>

        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
      </nav>

      {/* Mobile search overlay — drops down below navbar */}
      <div className={`mobile-search-overlay ${searchOpen ? "is-open" : ""}`}>
        <SearchBar autoFocus onSelect={() => setSearchOpen(false)} />
      </div>

      {/* ── Mobile bottom tab bar — NO logout ── */}
      <div className="mobile-nav">
        <NavLink to="/feed" className={({ isActive }) => isActive ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}>
          <span className="material-icons-round">home</span>
          <span className="mobile-nav__label">Feed</span>
        </NavLink>

        <NavLink to="/drafts" className={({ isActive }) => isActive ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}>
          <span className="material-icons-round">edit_note</span>
          <span className="mobile-nav__label">Drafts</span>
        </NavLink>

        <NavLink to="/messages" className={({ isActive }) => isActive ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}>
          <span className="material-icons-round">chat_bubble</span>
          <span className="mobile-nav__label">Messages</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => isActive ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}>
          <span className="material-icons-round">person</span>
          <span className="mobile-nav__label">Profile</span>
        </NavLink>

        <NotificationBell mobileNav />
      </div>
    </>
  );
}

export default Navbar;
