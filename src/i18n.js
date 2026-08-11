// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import { applyDirection } from "./utils/dir";

i18n.on("languageChanged", () => {
  applyDirection();
});

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: "en", // لغة افتراضية
    fallbackLng: "en",
    debug: false,

    backend: {
      loadPath: "/translations/{{lng}}.json", // 🔥 تحميل ملفات JSON من public
    },

    interpolation: {
      escapeValue: false,
    },

    // Both bundles are always loaded regardless of the active UI language —
    // this is what lets the Patient Assistant call t(key, { lng: 'ar'|'en' })
    // for a conversation-language-specific response without ever touching
    // the active UI language (i18n.changeLanguage is never called for this).
    // Without this, a fixed-lng lookup for a language that hasn't been
    // switched to yet would silently miss (i18next-http-backend only
    // fetches a language's file when something actually asks for it).
    preload: ["en", "ar"],
  });

// 🔁 تغيير اتجاه الصفحة تلقائياً عند تغيير اللغة
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

export default i18n;
