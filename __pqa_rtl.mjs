import { chromium } from "playwright";
import fs from "node:fs";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const BASE = "http://localhost:3000";
const AUTH_USER = { id: 1, email: "amina.saleh@example.com", first_name: "أمينة", last_name: "صالح", role: "patient" };
const errors = [];
const browser = await chromium.launch({ headless: true });

async function newPatientPage(context) {
  const page = await context.newPage();
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(`[console] ${msg.text()}`); });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: "fake-dev-token", user: AUTH_USER });
  return page;
}
async function shot(page, name) { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("saved", name); }
async function overflowCheck(page, label) {
  const o = await page.evaluate(() => ({ docWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }));
  const flag = o.docWidth > o.viewportWidth ? " *** HORIZONTAL OVERFLOW ***" : "";
  console.log(label, JSON.stringify(o) + flag);
}

const MOBILE = { width: 375, height: 812 };

// Switch to Arabic via Profile > Preferences, then verify across flows
const context = await browser.newContext({ viewport: MOBILE });
const page = await newPatientPage(context);
await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
// Preferences is tab index 4 (Overview, Medical, Rehab, Devices, Preferences, Security)
const tabs = page.locator(".pfl-segmented-option, .pfl-tabs button");
await tabs.nth(4).click().catch((e) => errors.push("preferences tab click failed: " + e.message));
await page.waitForTimeout(300);
const arabicBtn = page.locator("button", { hasText: "العربية" }).first();
await arabicBtn.click().catch((e) => errors.push("arabic switch click failed: " + e.message));
await page.waitForTimeout(500);
await shot(page, "rtl-profile-preferences");
await overflowCheck(page, "rtl-profile-preferences");

// Dashboard RTL
await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
await shot(page, "rtl-dashboard-mobile");
await overflowCheck(page, "rtl-dashboard-mobile");

// scrolled bottom check
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
await shot(page, "rtl-dashboard-mobile-scrolled");

// History drawer RTL
const historyBtn = page.locator(".patient-history-icon-button").first();
await historyBtn.click().catch((e) => errors.push("rtl history drawer click failed: " + e.message));
await page.waitForTimeout(400);
await shot(page, "rtl-dashboard-history-drawer");
await overflowCheck(page, "rtl-dashboard-history-drawer");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// Appointments RTL + details modal
await page.goto(BASE + "/patient/appointments", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await shot(page, "rtl-appointments-mobile");
await overflowCheck(page, "rtl-appointments-mobile");
const apptRow = page.locator(".appointment-row").first();
if (await apptRow.count()) {
  await apptRow.click().catch((e) => errors.push("rtl appointment row click failed: " + e.message));
  await page.waitForTimeout(400);
  await shot(page, "rtl-appointments-details-modal");
  await overflowCheck(page, "rtl-appointments-details-modal");
}

// Exercises RTL + modal
await page.goto(BASE + "/patient/exercises", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await shot(page, "rtl-exercises-mobile");
await overflowCheck(page, "rtl-exercises-mobile");
const infoBtn = page.locator(".exercise-info-button").first();
await infoBtn.click().catch((e) => errors.push("rtl exercise info click failed: " + e.message));
await page.waitForTimeout(400);
await shot(page, "rtl-exercises-details-modal");
await overflowCheck(page, "rtl-exercises-details-modal");

await context.close();
await browser.close();
fs.writeFileSync(`${OUT}/errors-rtl.log`, errors.join("\n"));
console.log("=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
