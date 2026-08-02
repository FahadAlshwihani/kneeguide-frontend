import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { LuLanguages } from "react-icons/lu";
import { ROUTES } from "../../../utils/routes";
import SecondaryButton from "../../../components/ui/SecondaryButton";
import ButtonArrow from "../../../components/ui/ButtonArrow";
import "./Header.css";

// Three cards — KneeGuide is a single-scroll landing page, not a
// multi-page corporate site, so almost every link below points at a
// homepage section anchor rather than a dedicated route. The only
// dedicated pages kept are ones that already existed (/technology,
// /contact) — no new routes were added.
const MENU_SECTIONS = [
  {
    key: "platform",
    colorClass: "header-menu-card--platform",
    links: [
      { key: "overview", to: "/#platform" },
      { key: "patientDashboard", to: "/#patient-portal" },
      { key: "doctorDashboard", to: "/#doctor-dashboard" },
    ],
  },
  {
    key: "technology",
    colorClass: "header-menu-card--technology",
    links: [
      { key: "motionTracking", to: "/#technology" },
      { key: "aiAssistant", to: "/#ai-assistant" },
      { key: "wearables", to: "/#technology" },
    ],
  },
  {
    key: "company",
    colorClass: "header-menu-card--company",
    links: [
      { key: "roadmap", to: "/#roadmap" },
      { key: "contact", to: "/contact" },
      { key: "documentation", to: "/#faq" },
    ],
  },
];

const TOP_BAR_HEIGHT = 64;
const PANEL_BOTTOM_GAP = 16;
const MENU_EASE = "power3.out";
const HIDE_SCROLL_THRESHOLD = 96;

const Header = () => {
  const { t, i18n } = useTranslation();

  // Two states, not one: `hamburgerOpen` flips the icon-to-X instantly.
  // `panelExpanded` is what actually gates the panel's visibility/
  // pointer-events, and on close it's only flipped back to false once the
  // reverse animation finishes (see toggleMenu) — otherwise the panel
  // would vanish instantly instead of shrinking away with the nav.
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);

  const headerRef = useRef(null);
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const cardRefs = useRef([]);
  const timelineRef = useRef(null);
  const panelExpandedRef = useRef(false);

  useEffect(() => {
    panelExpandedRef.current = panelExpanded;
  }, [panelExpanded]);

  // Lock page scroll behind the fullscreen overlay while the menu is open;
  // restore it the moment it isn't (covers both the close-button path and
  // any future unmount).
  useEffect(() => {
    document.body.style.overflow = panelExpanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelExpanded]);

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
    if (overlayRef.current) gsap.set(overlayRef.current, { opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: measureExpandedHeight, duration: 0.45, ease: MENU_EASE }, 0);
    if (overlayRef.current) {
      tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: MENU_EASE }, 0);
    }
    tl.to(cardRefs.current, { y: 0, opacity: 1, duration: 0.4, ease: MENU_EASE, stagger: 0.06 }, "-=0.15");
    return tl;
  };

  // Rebuilding the timeline (language change alters card text, so the
  // measured height changes) used to just `gsap.set` everything back to
  // its collapsed starting point — even if the menu was open at the time,
  // silently desyncing the DOM's visual state from `panelExpanded`, which
  // is what made the hamburger stop responding afterward. Jumping the
  // fresh timeline straight to its end (`progress(1)`) when the menu was
  // already open keeps the two in sync, exactly like the resize handler
  // below already does.
  useLayoutEffect(() => {
    const tl = buildTimeline();
    timelineRef.current = tl;
    if (tl && panelExpanded) tl.progress(1);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
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

  // Header hide-on-scroll-down / reveal-on-scroll-up — animates `transform`
  // via GSAP (never `display`), so it's always a smooth slide. Skips while
  // the menu is open (scroll is locked then anyway, see above) so the
  // header never slides away mid-interaction. Mount-once listener (a ref
  // tracks the latest `panelExpanded` instead of a dependency) so it isn't
  // torn down and rebuilt on every open/close.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (!panelExpandedRef.current) {
          const scrollingDown = currentY > lastY;
          const pastThreshold = currentY > HIDE_SCROLL_THRESHOLD;
          gsap.to(headerRef.current, {
            y: scrollingDown && pastThreshold ? "-130%" : "0%",
            duration: 0.35,
            ease: "power2.out",
          });
        }
        lastY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const langToggleLabel = t("publicHeader.languageSwitchLabel");
  const langToggleText = t("publicHeader.languageSwitchTo");

  return (
    <>
      {/* Rendered as a sibling of .header-root, not a child — .header-root
          gets a GSAP `transform` for the scroll-hide behavior, and a
          transformed ancestor would turn this `position: fixed` overlay
          into one scoped to that ancestor's box instead of the real
          viewport. Keeping it outside sidesteps that entirely. */}
      <div
        ref={overlayRef}
        className={`header-overlay${panelExpanded ? " header-overlay-visible" : ""}`}
        onClick={closeMenu}
        aria-hidden={!panelExpanded}
      />

      <header className="header-root" ref={headerRef}>
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
              {/* Desktop only (hidden on mobile via CSS) — the mobile copy
                  lives at the end of the menu panel instead, see below. */}
              <button
                type="button"
                className="header-lang-toggle header-lang-toggle--topbar"
                onClick={toggleLanguage}
                aria-label={langToggleLabel}
              >
                <LuLanguages aria-hidden="true" />
                {langToggleText}
              </button>

              <SecondaryButton to={ROUTES.LOGIN} size="sm" className="header-cta">
                {t("publicHeader.login")}
              </SecondaryButton>
            </div>
          </div>

          <div ref={panelRef} className="header-menu-panel" aria-hidden={!panelExpanded}>
            <div className="header-menu-cards">
              {MENU_SECTIONS.map((section, index) => (
                <div
                  key={section.key}
                  ref={setCardRef(index)}
                  className={`header-menu-card ${section.colorClass}`}
                >
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

            {/* Mobile only (hidden on desktop via CSS, where the top-bar
                copy above covers it) — last element in the panel, styled
                as a footer action rather than another nav item. */}
            <button
              type="button"
              className="header-lang-toggle header-lang-toggle--menu"
              onClick={toggleLanguage}
              aria-label={langToggleLabel}
            >
              <LuLanguages aria-hidden="true" />
              {langToggleText}
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
