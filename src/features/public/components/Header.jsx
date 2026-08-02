import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../utils/routes";
import SecondaryButton from "../../../components/ui/SecondaryButton";
import "./Header.css";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/technology", label: "Technology" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header-root">
      <nav className="header-nav">
        <Link className="header-logo" to="/">
          <span className="header-logo-mark">KG</span>
          KneeGuide
        </Link>

        <button
          type="button"
          className="header-menu-toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`header-links${menuOpen ? " header-links-open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} className="header-link" to={link.to}>
              {link.label}
            </Link>
          ))}
          <SecondaryButton to={ROUTES.LOGIN} size="sm" className="header-cta">
            Login
          </SecondaryButton>
        </div>
      </nav>
    </header>
  );
};

export default Header;
