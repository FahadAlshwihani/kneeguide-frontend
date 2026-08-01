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
    lng: "ar", // لغة افتراضية (TEMP: reverted after RTL verification screenshot)
    fallbackLng: "en",
    debug: false,

    backend: {
      loadPath: "/translations/{{lng}}.json", // 🔥 تحميل ملفات JSON من public
    },

    interpolation: {
      escapeValue: false,
    },
  });

// 🔁 تغيير اتجاه الصفحة تلقائياً عند تغيير اللغة
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

export default i18n;
