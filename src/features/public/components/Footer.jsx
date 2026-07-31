import React from "react";
import { Link } from "react-router-dom";
import { FaXTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import "./Footer.css";

const PRODUCT_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/technology", label: "Technology" },
  { to: "/how-it-works", label: "How It Works" },
];

const COMPANY_LINKS = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo">KneeGuide</span>
            <p className="footer-tagline">
              AI-guided knee rehabilitation, connecting patients and clinicians
              between every appointment.
            </p>
            <div className="footer-social">
              <a href="https://twitter.com" aria-label="KneeGuide on X" className="footer-social-link">
                <FaXTwitter aria-hidden="true" />
              </a>
              <a href="https://linkedin.com" aria-label="KneeGuide on LinkedIn" className="footer-social-link">
                <FaLinkedinIn aria-hidden="true" />
              </a>
              <a href="https://instagram.com" aria-label="KneeGuide on Instagram" className="footer-social-link">
                <FaInstagram aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="footer-links-col">
            <span className="footer-links-title">Product</span>
            <ul className="footer-links">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-col">
            <span className="footer-links-title">Company</span>
            <ul className="footer-links">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">&copy; {new Date().getFullYear()} KneeGuide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
