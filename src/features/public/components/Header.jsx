import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { LuLanguages, LuLayoutDashboard, LuCompass } from "react-icons/lu";
import { ROUTES } from "../../../utils/routes";
import { PUBLIC_NAVIGATION } from "../navigation/publicNavigation";
import { useSectionNavigation } from "../navigation/useSectionNavigation";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import SecondaryButton from "../../../components/ui/SecondaryButton";
import ButtonArrow from "../../../components/ui/ButtonArrow";
import BrandLogo from "./BrandLogo";
import "./Header.css";

// KneeGuide is a single-scroll landing page, not a multi-page corporate
// site — every mega-menu link targets a homepage section anchor from the
// canonical PUBLIC_NAVIGATION model (shared with Footer.jsx), never a
// standalone routed page. Icons are a Header-presentation-only concern,
// so they're mapped locally by group key instead of living in the shared
// nav config.
const GROUP_ICONS = {
  product: LuLayoutDashboard,
  explore: LuCompass,
};

const TOP_BAR_HEIGHT = 64;
const PANEL_BOTTOM_GAP = 16;
const MENU_EASE = "power3.out";
const HIDE_SCROLL_THRESHOLD = 96;

const Header = () => {
  const { t, i18n } = useTranslation();
  const { goToSection, goHome } = useSectionNavigation();

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

  // Lock page scroll behind the fullscreen overlay while the menu is open.
  // `overflow: hidden` alone removes the scrollbar, which widens the
  // content area by the scrollbar's own width and shifts everything
  // horizontally unless compensated — but *which side* to pad depends on
  // direction: browsers render the vertical scrollbar on the physical
  // right in LTR documents and on the physical left in RTL ones, so a
  // hardcoded `padding-right` only ever cancels the shift in one of the
  // two directions (this is what caused the RTL bug). `html` also carries
  // a permanent `scrollbar-gutter: stable` (index.css) that already
  // prevents this shift entirely in supporting browsers — there,
  // `clientWidth` is unaffected by the lock and this measures ~0, so nothing
  // below actually applies; this stays purely as the fallback for browsers
  // that don't support it.
  //
  // Original inline values are captured as local consts (not assumed to
  // be empty strings) and restored by this exact effect run's own cleanup
  // closure — so it's automatically exact whether the menu closes
  // normally, the component unmounts while open, or (since `i18n.language`
  // is a dependency) the direction flips mid-open: React tears down the
  // old lock (restoring the true pre-lock styles) before re-running this
  // effect to re-measure and re-lock for the new direction.
  useEffect(() => {
    if (!panelExpanded) return undefined;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;
    const originalPaddingLeft = body.style.paddingLeft;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const isRTL = document.documentElement.dir === "rtl";

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      if (isRTL) {
        body.style.paddingLeft = `${scrollbarWidth}px`;
      } else {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
      body.style.paddingLeft = originalPaddingLeft;
    };
  }, [panelExpanded, i18n.language]);

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

            <Link
              className="header-logo"
              to="/"
              onClick={(event) => {
                event.preventDefault();
                closeMenu();
                goHome();
              }}
            >
              <BrandLogo className="header-logo-mark brand-logo-light" />
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

              {/* Desktop/tablet only (hidden on mobile via CSS) — Login
                  alone stays in the mobile top bar so it doesn't overcrowd
                  it; Create Account moves into the menu panel instead, see
                  .header-menu-actions below. Stronger CTA than Login (a
                  PrimaryButton, not Secondary), mirroring the same
                  Register-is-primary/Login-is-secondary pairing the
                  homepage's own closing CTA already uses (CTA/index.jsx) —
                  so Header never contradicts it. */}
              <PrimaryButton to={ROUTES.REGISTER} size="sm" className="header-cta header-cta-create">
                {t("publicHeader.createAccount")}
              </PrimaryButton>
            </div>
          </div>

          <div ref={panelRef} className="header-menu-panel" aria-hidden={!panelExpanded}>
            <div className="header-menu-cards">
              {PUBLIC_NAVIGATION.map((group, index) => {
                const Icon = GROUP_ICONS[group.key];
                return (
                  <div
                    key={group.key}
                    ref={setCardRef(index)}
                    className={`header-menu-card header-menu-card--${group.key}`}
                  >
                    <div className="header-menu-card-title">
                      <Icon className="header-menu-card-icon" aria-hidden="true" strokeWidth={2} />
                      <span className="header-menu-card-label">{t(group.labelKey)}</span>
                    </div>
                    <div className="header-menu-card-links">
                      {group.items.map((item) => (
                        <Link
                          key={item.key}
                          to={`/#${item.id}`}
                          className="header-menu-card-link"
                          onClick={(event) => {
                            event.preventDefault();
                            closeMenu();
                            goToSection(item.id);
                          }}
                        >
                          <ButtonArrow />
                          {t(item.labelKey)}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Makes both auth paths discoverable from inside the expanded
                menu itself, not just the (easy-to-miss on a small top bar)
                actions above — same Create-Account-is-primary/Login-is-
                secondary pairing as .header-actions and the homepage's own
                CTA section. Real routes, not homepage sections, so these
                navigate via Link `to`, not goToSection; `closeMenu` still
                runs on click so the panel doesn't stay visibly open for a
                frame during the route transition, matching every nav card
                link above. */}
            <div className="header-menu-actions">
              <SecondaryButton to={ROUTES.LOGIN} size="sm" onClick={closeMenu} className="header-menu-action">
                {t("publicHeader.login")}
              </SecondaryButton>
              <PrimaryButton to={ROUTES.REGISTER} size="sm" onClick={closeMenu} className="header-menu-action">
                {t("publicHeader.createAccount")}
              </PrimaryButton>
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
