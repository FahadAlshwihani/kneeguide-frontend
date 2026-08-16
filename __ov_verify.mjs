import { chromium } from "playwright";
import fs from "node:fs";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const BASE = "http://localhost:3000";
const errors = [];
const browser = await chromium.launch({ headless: true });

async function auth(page, arabic = false) {
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
}

function check(info, label) {
  const docOverflow = info.docScrollWidth > info.docClientWidth;
  const panelOverflow = info.panelScrollWidth > info.panelClientWidth;
  const flag = (docOverflow || panelOverflow) ? " *** OVERFLOW ***" : " OK";
  console.log(`${label}: doc ${info.docScrollWidth}/${info.docClientWidth} | panel ${info.panelScrollWidth}/${info.panelClientWidth}${flag}`);
  if (docOverflow || panelOverflow) errors.push(`OVERFLOW at ${label}: ${JSON.stringify(info)}`);
}

async function measure(page, panelSelector) {
  return page.evaluate((sel) => {
    const panel = document.querySelector(sel);
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      panelScrollWidth: panel?.scrollWidth ?? 0,
      panelClientWidth: panel?.clientWidth ?? 0,
    };
  }, panelSelector);
}

const WIDTHS = [320, 360, 375, 390, 412, 430];

for (const lang of ["ltr", "rtl"]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 850 } });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
    await auth(page);

    if (lang === "rtl") {
      // set language via profile preferences first
      await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const tabs = page.locator(".pfl-segmented-option, .pfl-tabs button");
      await tabs.nth(4).click().catch(() => {});
      await page.waitForTimeout(250);
      await page.locator("button", { hasText: "العربية" }).first().click().catch(() => {});
      await page.waitForTimeout(300);
    }

    // ---- Exercise Detail modal ----
    await page.goto(BASE + "/patient/exercises", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const infoCount = await page.locator(".exercise-info-button").count();
    for (let i = 0; i < infoCount; i++) {
      await page.locator(".exercise-info-button").nth(i).click();
      await page.waitForTimeout(300);
      const info = await measure(page, ".exercise-details-panel");
      check(info, `[${lang}][w${width}] exercise-modal[${i}]`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
    }

    // ---- Appointment details modal ----
    await page.goto(BASE + "/patient/appointments", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const apptRowCount = await page.locator(".appointment-row").count();
    for (let i = 0; i < Math.min(apptRowCount, 3); i++) {
      await page.locator(".appointment-row").nth(i).click();
      await page.waitForTimeout(300);
      const info = await measure(page, ".appointment-details-panel");
      check(info, `[${lang}][w${width}] appt-details-modal[${i}]`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
    }

    // ---- Appointment request flow: click all the way through ----
    await page.locator(".pa-request-cta button").first().click().catch((e) => errors.push("request cta failed: " + e.message));
    await page.waitForTimeout(300);
    let info = await measure(page, ".appointment-request-panel");
    check(info, `[${lang}][w${width}] request-flow-step-reason`);

    // pick first reason chip, then Next
    await page.locator(".appointment-request-reason").first().click().catch(() => {});
    await page.waitForTimeout(150);
    await page.locator("button", { hasText: /Next|التالي/ }).first().click().catch((e) => errors.push("next(reason) failed: " + e.message));
    await page.waitForTimeout(300);
    info = await measure(page, ".appointment-request-panel");
    check(info, `[${lang}][w${width}] request-flow-step-datetime`);
    await page.screenshot({ path: `${OUT}/verify-${lang}-w${width}-datetime.png` });

    // pick first available day chip + first slot if present
    await page.locator(".availability-day-chip").first().click().catch(() => {});
    await page.waitForTimeout(200);
    await page.locator(".availability-slot").first().click().catch(() => {});
    await page.waitForTimeout(200);
    info = await measure(page, ".appointment-request-panel");
    check(info, `[${lang}][w${width}] request-flow-step-datetime-selected`);
    await page.locator("button", { hasText: /Next|التالي/ }).first().click().catch((e) => errors.push("next(datetime) failed: " + e.message));
    await page.waitForTimeout(300);
    info = await measure(page, ".appointment-request-panel");
    check(info, `[${lang}][w${width}] request-flow-step-note`);
    await page.screenshot({ path: `${OUT}/verify-${lang}-w${width}-note.png` });

    await context.close();
  }
}

await browser.close();
fs.writeFileSync(`${OUT}/errors-verify.log`, errors.join("\n"));
console.log("=== SUMMARY ===");
console.log(errors.length ? `${errors.length} issues:\n` + errors.join("\n") : "ZERO OVERFLOW / ZERO ERRORS ACROSS ALL CHECKS");
