import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_PREFERENCES,
  SUPPORTED_LANGUAGES,
  THEME_PREFERENCES,
  loadPatientPreferences,
  savePatientPreferences,
} from "./patientPreferencesStorage";

/**
 * The ONE seam for Patient-scoped UI preferences (language + appearance) —
 * Section 40's "PatientPreferencesProvider -> stored preference -> resolved
 * appearance -> PatientLayout data attribute -> patientTokens -> all
 * Patient pages" chain. Mounted once in PatientLayout.jsx (same precedent
 * as KneeGuideDeviceProvider/PatientDock: shared chrome, not re-created per
 * page), so every Patient page/Profile/Preferences reads and writes the
 * exact same instance.
 *
 * Deliberately NOT a global application ThemeContext — this only ever
 * touches `.patient-shell` (see PatientLayout.jsx applying the
 * `data-patient-theme` attribute this hook resolves), never `:root` or
 * `document.body`, so Doctor/Public/Auth are structurally unable to see it.
 *
 * LANGUAGE: reuses the existing global i18next instance via
 * `i18n.changeLanguage()` — the same call LanguageDropdown already made —
 * never a parallel translation mechanism. i18n.js's own
 * `languageChanged` listener already calls `applyDirection()` (documents
 * dir/lang + body rtl/ltr class), so this hook doesn't duplicate that
 * either; it only decides WHEN to call `changeLanguage` and persists the
 * choice. On first mount with no stored preference, the current active
 * `i18n.language` is treated as the language rather than hardcoding "en",
 * so this never fights whatever language the app was already showing.
 *
 * THEME: `preference` (system|light|dark) is distinct from `resolvedTheme`
 * (light|dark) per Section 19/38. When `preference === "system"`,
 * `resolvedTheme` tracks `matchMedia("(prefers-color-scheme: dark)")` live
 * via a change listener (cleaned up on unmount/preference change) — no
 * polling. Explicit "light"/"dark" ignores subsequent OS changes until
 * "system" is re-selected. If `matchMedia` is unavailable, resolution falls
 * back to the existing/default Patient dark theme (Section 49).
 *
 * FLASH PREVENTION (Section 39): the initial preference/resolvedTheme is
 * computed synchronously in `useState`'s initializer (localStorage read +
 * matchMedia read), not in a `useEffect` — so PatientLayout's very first
 * render already carries the correct `data-patient-theme` attribute
 * instead of painting dark-then-swapping-to-light a frame later. This is
 * the smallest architecture that prevents the obvious flash: no separate
 * bootloader script, nothing written to `public/index.html` (which would
 * risk leaking a Patient concern into every route the app has, including
 * Doctor/Public/Auth) — see the final report for why this was judged
 * sufficient rather than under-built.
 */

const getSystemPrefersDark = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

const resolveTheme = (preference, systemPrefersDark) => {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
};

const buildInitialState = (activeI18nLanguage) => {
  const stored = loadPatientPreferences();
  const language = stored?.language || (SUPPORTED_LANGUAGES.includes(activeI18nLanguage) ? activeI18nLanguage : DEFAULT_PREFERENCES.language);
  const theme = stored?.theme || DEFAULT_PREFERENCES.theme;
  const systemPrefersDark = getSystemPrefersDark();
  return { language, theme, systemPrefersDark, resolvedTheme: resolveTheme(theme, systemPrefersDark) };
};

const PatientPreferencesContext = createContext(null);

export const PatientPreferencesProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [state, setState] = useState(() => buildInitialState(i18n.language));

  // Keeps the chosen language actually applied to i18next even if this
  // provider mounts after i18n already initialized with a different value
  // (e.g. a stored Patient preference from a previous session disagrees
  // with the app's current default) — a no-op when they already match,
  // since i18next itself no-ops `changeLanguage` for the active language.
  useEffect(() => {
    if (i18n.language !== state.language) {
      i18n.changeLanguage(state.language);
    }
    // Only ever re-runs if `state.language` itself changes via setLanguage
    // below — i18n.language changing from elsewhere is intentionally not
    // synced back here, since Patient scope is the one place that owns
    // this decision going forward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.language]);

  // Live OS theme tracking — only matters while `theme === "system"`, but
  // the listener is only ever attached in that branch anyway (cheaper than
  // attaching unconditionally and filtering inside the handler).
  useEffect(() => {
    if (state.theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    let mediaQuery;
    try {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return undefined;
    }

    const handleChange = (event) => {
      setState((prev) => (prev.theme === "system" ? { ...prev, systemPrefersDark: event.matches, resolvedTheme: resolveTheme("system", event.matches) } : prev));
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Older Safari fallback — still cleaned up on unmount.
    mediaQuery.addListener?.(handleChange);
    return () => mediaQuery.removeListener?.(handleChange);
  }, [state.theme]);

  const setLanguage = useCallback((nextLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
    setState((prev) => {
      if (prev.language === nextLanguage) return prev;
      savePatientPreferences({ language: nextLanguage, theme: prev.theme });
      return { ...prev, language: nextLanguage };
    });
  }, []);

  const setTheme = useCallback((nextPreference) => {
    if (!THEME_PREFERENCES.includes(nextPreference)) return;
    setState((prev) => {
      savePatientPreferences({ language: prev.language, theme: nextPreference });
      const systemPrefersDark = nextPreference === "system" ? getSystemPrefersDark() : prev.systemPrefersDark;
      return { ...prev, theme: nextPreference, systemPrefersDark, resolvedTheme: resolveTheme(nextPreference, systemPrefersDark) };
    });
  }, []);

  const value = useMemo(
    () => ({
      language: state.language,
      setLanguage,
      theme: state.theme,
      setTheme,
      resolvedTheme: state.resolvedTheme,
    }),
    [state.language, state.theme, state.resolvedTheme, setLanguage, setTheme]
  );

  return <PatientPreferencesContext.Provider value={value}>{children}</PatientPreferencesContext.Provider>;
};

export const usePatientPreferences = () => {
  const context = useContext(PatientPreferencesContext);
  if (!context) {
    throw new Error("usePatientPreferences must be used within a PatientPreferencesProvider");
  }
  return context;
};
