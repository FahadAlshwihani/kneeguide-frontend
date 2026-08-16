import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 568 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
await page.goto("http://localhost:3000/patient/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(4500);

const info = await page.evaluate(() => {
  const composerForm = document.querySelector(".patient-assistant-form");
  const dockWrapper = document.querySelector(".patient-dock-wrapper");
  const shellContent = document.querySelector(".patient-shell-content");
  const pdPage = document.querySelector(".pd-page");
  const suggestions = document.querySelector(".patient-assistant-suggestions");
  const rect = (el) => el ? el.getBoundingClientRect() : null;
  const cs = (el, prop) => el ? getComputedStyle(el)[prop] : null;
  return {
    composerRect: rect(composerForm),
    dockRect: rect(dockWrapper),
    shellContentPaddingBottom: cs(shellContent, "paddingBottom"),
    pdPagePaddingBottom: cs(pdPage, "paddingBottom"),
    pdPageHeight: rect(pdPage)?.height,
    docScrollHeight: document.documentElement.scrollHeight,
    windowInnerHeight: window.innerHeight,
    suggestionsRect: rect(suggestions),
    suggestionsScrollWidth: suggestions?.scrollWidth,
    suggestionsClientWidth: suggestions?.clientWidth,
    suggestionsPaddingInlineEnd: cs(suggestions, "paddingInlineEnd"),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
