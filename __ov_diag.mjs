import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
await page.goto("http://localhost:3000/patient/exercises", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const infoBtn = page.locator(".exercise-info-button").first();
await infoBtn.click();
await page.waitForTimeout(400);

const info = await page.evaluate(() => {
  const panel = document.querySelector(".exercise-details-panel");
  const media = document.querySelector(".exercise-details-media");
  const iframe = document.querySelector(".exercise-details-media iframe");
  const cs = (el) => el ? getComputedStyle(el) : null;
  const rect = (el) => el ? el.getBoundingClientRect() : null;
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    panelRect: rect(panel),
    panelComputedMaxWidth: cs(panel)?.maxWidth,
    panelComputedWidth: cs(panel)?.width,
    panelBoxSizing: cs(panel)?.boxSizing,
    mediaRect: rect(media),
    iframeRect: rect(iframe),
    iframeComputedWidth: cs(iframe)?.width,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: `${OUT}/overflow-exercise-modal-375.png`, fullPage: false });
await browser.close();
