import i18n from "../i18n";

export function applyDirection() {
  const lng = i18n.language;

  const isRTL = lng === "ar";

  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lng);

  document.body.classList.remove("rtl", "ltr");
  document.body.classList.add(isRTL ? "rtl" : "ltr");
}
