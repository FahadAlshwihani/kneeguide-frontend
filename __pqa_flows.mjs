import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";
const AUTH_USER = { id: 1, email: "amina.saleh@example.com", first_name: "Amina", last_name: "Saleh", role: "patient" };
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
const DESKTOP = { width: 1440, height: 900 };

// ============ EXERCISES (Flow B) ============
for (const [vpName, vp] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
  const context = await browser.newContext({ viewport: vp });
  const page = await newPatientPage(context);
  await page.goto(BASE + "/patient/exercises", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, `exercises-${vpName}-top`);
  await overflowCheck(page, `exercises-${vpName}-top`);

  const infoBtn = page.locator(".exercise-info-button").first();
  await infoBtn.click().catch((e) => errors.push("exercise info click failed: " + e.message));
  await page.waitForTimeout(400);
  await shot(page, `exercises-${vpName}-details-modal`);
  await overflowCheck(page, `exercises-${vpName}-details-modal`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  const reportBtn = page.locator(".session-history-view-btn, .session-history-card-btn").first();
  const hasReportBtn = await reportBtn.count();
  if (hasReportBtn) {
    await reportBtn.click().catch((e) => errors.push("session report click failed: " + e.message));
    await page.waitForTimeout(400);
    await shot(page, `exercises-${vpName}-session-report-modal`);
  } else {
    console.log(`exercises-${vpName}: no session report button found on this page (may be Reports-only)`);
  }
  await context.close();
}

// ============ APPOINTMENTS (Flow C) ============
for (const [vpName, vp] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
  const context = await browser.newContext({ viewport: vp });
  const page = await newPatientPage(context);
  await page.goto(BASE + "/patient/appointments", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, `appointments-${vpName}-top`);
  await overflowCheck(page, `appointments-${vpName}-top`);

  const apptRow = page.locator(".appointment-row").first();
  if (await apptRow.count()) {
    await apptRow.click().catch((e) => errors.push("appointment row click failed: " + e.message));
    await page.waitForTimeout(400);
    await shot(page, `appointments-${vpName}-details-modal`);
    await overflowCheck(page, `appointments-${vpName}-details-modal`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  const requestBtn = page.locator(".pa-request-cta button").first();
  await requestBtn.click().catch((e) => errors.push("request appointment click failed: " + e.message));
  await page.waitForTimeout(400);
  await shot(page, `appointments-${vpName}-request-flow`);
  await overflowCheck(page, `appointments-${vpName}-request-flow`);
  await context.close();
}

// ============ REPORTS (Flow D) ============
for (const [vpName, vp] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
  const context = await browser.newContext({ viewport: vp });
  const page = await newPatientPage(context);
  await page.goto(BASE + "/patient/reports", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, `reports-${vpName}-top`);
  await overflowCheck(page, `reports-${vpName}-top`);

  const reportBtn = page.locator(".session-history-view-btn, .session-history-card-btn").first();
  if (await reportBtn.count()) {
    await reportBtn.click().catch((e) => errors.push("reports view click failed: " + e.message));
    await page.waitForTimeout(400);
    await shot(page, `reports-${vpName}-recovery-modal`);
    await overflowCheck(page, `reports-${vpName}-recovery-modal`);
  }
  await context.close();
}

// ============ PROFILE (Flow F) ============
for (const [vpName, vp] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
  const context = await browser.newContext({ viewport: vp });
  const page = await newPatientPage(context);
  await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, `profile-${vpName}-overview`);
  await overflowCheck(page, `profile-${vpName}-overview`);

  const tabs = page.locator(".pfl-segmented-option, .pfl-tabs button");
  const count = await tabs.count();
  console.log(`profile-${vpName}: found ${count} tabs`);
  for (let i = 0; i < Math.min(count, 6); i++) {
    await tabs.nth(i).click().catch((e) => errors.push(`profile tab ${i} click failed: ` + e.message));
    await page.waitForTimeout(350);
    await shot(page, `profile-${vpName}-tab${i}`);
    await overflowCheck(page, `profile-${vpName}-tab${i}`);
  }
  await context.close();
}

// ============ CONVERSATION HISTORY DRAWER (mobile only, from Dashboard) ============
{
  const context = await browser.newContext({ viewport: MOBILE });
  const page = await newPatientPage(context);
  await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);
  const historyBtn = page.locator(".patient-history-icon-button").first();
  await historyBtn.click().catch((e) => errors.push("history drawer click failed: " + e.message));
  await page.waitForTimeout(400);
  await shot(page, "dashboard-mobile-history-drawer");
  await overflowCheck(page, "dashboard-mobile-history-drawer");
  await context.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/errors-flows.log`, errors.join("\n"));
console.log("=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
