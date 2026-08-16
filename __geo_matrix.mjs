import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });

async function auth(page) {
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
}

async function toArabic(page) {
  await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.locator(".pfl-segmented-option, .pfl-tabs button").nth(4).click();
  await page.waitForTimeout(250);
  await page.locator("button", { hasText: "العربية" }).first().click();
  await page.waitForTimeout(300);
}

function geoCheck(rect, innerWidth) {
  if (!rect) return "MISSING";
  const ok = rect.left >= -0.5 && rect.right <= innerWidth + 0.5;
  return ok ? "OK" : `*** CLIPPED (left=${rect.left}, right=${rect.right}, innerWidth=${innerWidth}) ***`;
}

async function measurePanel(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, width: r.width, innerWidth: window.innerWidth };
  }, sel);
}

const WIDTHS = [320, 375, 390, 430];

for (const lang of ["rtl", "ltr"]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 750 } });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.log(`[${lang}][${width}][pageerror]`, e.message));
    await auth(page);
    if (lang === "rtl") await toArabic(page);

    // Exercise Details modal via the exact user path
    await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(4500);
    const chipText = lang === "rtl" ? "عرض تمارين اليوم" : "Show today's exercises";
    await page.locator(".patient-assistant-chip", { hasText: chipText }).first().click().catch(() => {});
    await page.waitForTimeout(900);
    const openProgramText = lang === "rtl" ? "فتح برنامج التمارين" : /Open.*program/i;
    await page.locator("button, a", { hasText: openProgramText }).first().click().catch(() => {});
    await page.waitForTimeout(700);
    const infoCount = await page.locator(".exercise-info-button").count();
    if (infoCount > 0) {
      await page.locator(".exercise-info-button").first().click();
      await page.waitForTimeout(500);
      const g = await measurePanel(page, ".exercise-details-panel");
      console.log(`[${lang}][${width}] exercise-modal:`, JSON.stringify(g), geoCheck(g, g?.innerWidth));
      if (width === 320 || width === 430) await page.screenshot({ path: `${OUT}/matrix-${lang}-${width}-exercise.png` });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    } else {
      console.log(`[${lang}][${width}] exercise-modal: could not reach (no info buttons found, url=${page.url()})`);
    }

    // Appointment Details modal
    await page.goto(BASE + "/patient/appointments", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const apptRow = page.locator(".appointment-row").first();
    if (await apptRow.count()) {
      await apptRow.click();
      await page.waitForTimeout(400);
      const g = await measurePanel(page, ".appointment-details-panel");
      console.log(`[${lang}][${width}] appt-details-modal:`, JSON.stringify(g), geoCheck(g, g?.innerWidth));
      if (width === 320) await page.screenshot({ path: `${OUT}/matrix-${lang}-${width}-appt-details.png` });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }

    // Appointment Request flow
    await page.locator(".pa-request-cta button").first().click().catch(() => {});
    await page.waitForTimeout(400);
    const g2 = await measurePanel(page, ".appointment-request-panel");
    console.log(`[${lang}][${width}] appt-request-modal:`, JSON.stringify(g2), geoCheck(g2, g2?.innerWidth));
    if (width === 320) await page.screenshot({ path: `${OUT}/matrix-${lang}-${width}-appt-request.png` });

    await context.close();
  }
}
await browser.close();
console.log("done");
