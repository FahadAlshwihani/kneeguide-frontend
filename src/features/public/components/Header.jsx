import React, { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { LuLanguages } from "react-icons/lu";
import { ROUTES } from "../../../utils/routes";
import SecondaryButton from "../../../components/ui/SecondaryButton";
import ButtonArrow from "../../../components/ui/ButtonArrow";
import "./Header.css";

// Six KneeGuide menu cards. Sub-items without a dedicated page/anchor of
// their own point at the closest existing destination (e.g. all three
// Technology sub-items go to the existing /technology page) rather than
// inventing new routes — this is a visual/interaction rebuild only, no
// new application logic or pages.
const MENU_SECTIONS = [
  {
    key: "platform",
    links: [
      { key: "overview", to: "/#platform" },
      { key: "patientPortal", to: "/#patient-portal" },
      { key: "doctorDashboard", to: "/#doctor-dashboard" },
    ],
  },
  {
    key: "technology",
    links: [
      { key: "motionTracking", to: "/technology" },
      { key: "wearableIntegration", to: "/technology" },
      { key: "security", to: "/technology" },
    ],
  },
  {
    key: "aiAssistant",
    links: [
      { key: "smartAnalysis", to: "/#ai-assistant" },
      { key: "exerciseRecommendations", to: "/#ai-assistant" },
      { key: "progressReports", to: "/#ai-assistant" },
    ],
  },
  {
    key: "howItWorks",
    links: [
      { key: "patientJourney", to: "/how-it-works" },
      { key: "doctorWorkflow", to: "/how-it-works" },
      { key: "rehabilitationProcess", to: "/how-it-works" },
    ],
  },
  {
    key: "roadmap",
    links: [
      { key: "currentVersion", to: "/#roadmap" },
      { key: "upcomingFeatures", to: "/#roadmap" },
      { key: "futureVision", to: "/#roadmap" },
    ],
  },
  {
    key: "contact",
    links: [
      { key: "contactUs", to: "/contact" },
      { key: "documentation", to: "/contact" },
      { key: "support", to: "/contact" },
    ],
  },
];

const TOP_BAR_HEIGHT = 64;
const PANEL_BOTTOM_GAP = 16;
const MENU_EASE = "power3.out";

const Header = () => {
  const { t, i18n } = useTranslation();

  // Two states, not one: `hamburgerOpen` flips the icon-to-X instantly.
  // `panelExpanded` is what actually gates the panel's visibility/
  // pointer-events, and on close it's only flipped back to false once the
  // reverse animation finishes (see toggleMenu) — otherwise the panel
  // would vanish instantly instead of shrinking away with the nav.
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);

  const navRef = useRef(null);
  const panelRef = useRef(null);
  const cardRefs = useRef([]);
  const timelineRef = useRef(null);

  const measureExpandedHeight = () => {
    const panelEl = panelRef.current;
    if (!panelEl) return TOP_BAR_HEIGHT;
    return TOP_BAR_HEIGHT + panelEl.scrollHeight + PANEL_BOTTOM_GAP;
  };

  const buildTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: TOP_BAR_HEIGHT });
    gsap.set(cardRefs.current, { y: 40, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: measureExpandedHeight, duration: 0.45, ease: MENU_EASE });
    tl.to(cardRefs.current, { y: 0, opacity: 1, duration: 0.4, ease: MENU_EASE, stagger: 0.06 }, "-=0.15");
    return tl;
  };

  useLayoutEffect(() => {
    timelineRef.current = buildTimeline();
    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
    // Rebuild on language change too — card label lengths differ enough
    // between English and Arabic to shift the measured panel height.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!timelineRef.current) return;
      timelineRef.current.kill();
      const tl = buildTimeline();
      if (!tl) return;
      timelineRef.current = tl;
      if (panelExpanded) tl.progress(1);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelExpanded]);

  const toggleMenu = () => {
    const tl = timelineRef.current;
    if (!tl) return;

    if (!panelExpanded) {
      setHamburgerOpen(true);
      setPanelExpanded(true);
      tl.play(0);
    } else {
      setHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setPanelExpanded(false));
      tl.reverse();
    }
  };

  const closeMenu = () => {
    if (panelExpanded) toggleMenu();
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(nextLang === "ar" ? "rtl" : "ltr");
  };

  const setCardRef = (index) => (el) => {
    cardRefs.current[index] = el;
  };

  return (
    <header className="header-root">
      <div ref={navRef} className={`header-nav${panelExpanded ? " header-nav-expanded" : ""}`}>
        <div className="header-top">
          <button
            type="button"
            className={`header-menu-toggle${hamburgerOpen ? " open" : ""}`}
            onClick={toggleMenu}
            aria-expanded={hamburgerOpen}
            aria-label={t(hamburgerOpen ? "publicHeader.menuToggleClose" : "publicHeader.menuToggleOpen")}
          >
            <span className="header-menu-toggle-line" />
            <span className="header-menu-toggle-line" />
          </button>

          <Link className="header-logo" to="/" onClick={closeMenu}>
            <span className="header-logo-mark">KG</span>
            KneeGuide
          </Link>

          <div className="header-actions">
            <button
              type="button"
              className="header-lang-toggle"
              onClick={toggleLanguage}
              aria-label={t("publicHeader.languageSwitchLabel")}
            >
              <LuLanguages aria-hidden="true" />
              {t("publicHeader.languageSwitchTo")}
            </button>

            <SecondaryButton to={ROUTES.LOGIN} size="sm" className="header-cta">
              {t("publicHeader.login")}
            </SecondaryButton>
          </div>
        </div>

        <div ref={panelRef} className="header-menu-panel" aria-hidden={!panelExpanded}>
          {MENU_SECTIONS.map((section, index) => (
            <div key={section.key} ref={setCardRef(index)} className="header-menu-card">
              <div className="header-menu-card-label">{t(`publicHeader.menu.${section.key}.title`)}</div>
              <div className="header-menu-card-links">
                {section.links.map((link) => (
                  <Link key={link.key} to={link.to} className="header-menu-card-link" onClick={closeMenu}>
                    <ButtonArrow />
                    {t(`publicHeader.menu.${section.key}.links.${link.key}`)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
