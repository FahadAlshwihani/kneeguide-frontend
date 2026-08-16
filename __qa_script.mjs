import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "C:\\Users\\DELL\\AppData\\Local\\Temp\\claude\\c--Users-DELL-Projects-kneeguide-frontend\\2b5dc5a7-5b31-4a64-a190-ab5442cd64f4\\scratchpad\\shots";
fs.mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";

const AUTH_USER = {
  id: 1,
  email: "sarah.ahmed@kneeguide.com",
  first_name: "Sarah",
  last_name: "Ahmed",
  role: "doctor",
};

const browser = await chromium.launch({ headless: true });
const errors = [];

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: false });
  console.log("saved", name);
}

async function newDoctorPage(context) {
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  // Seed auth in localStorage first (needs an origin loaded), then reload into the target route.
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: "fake-dev-token", user: AUTH_USER });
  return page;
}

// ---------- 1440x900 ----------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await newDoctorPage(context);
  await page.goto(BASE + "/doctor/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "01-1440x900-welcome-top");

  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollerHandle = await page.evaluateHandle(() => document.querySelector(".doctor-shell-content"));
  await page.evaluate((el) => { if (el) el.scrollTop = el.scrollHeight; }, scrollerHandle);
  await page.waitForTimeout(300);
  await shot(page, "02-1440x900-welcome-scrolled-bottom");

  const metrics = await page.evaluate(() => {
    const shellContent = document.querySelector(".doctor-shell-content");
    const dashboard = document.querySelector(".doctor-dashboard");
    const assistant = document.querySelector(".doctor-assistant");
    return {
      shellContentClientHeight: shellContent?.clientHeight,
      shellContentScrollHeight: shellContent?.scrollHeight,
      dashboardHeight: dashboard?.getBoundingClientRect().height,
      assistantHeight: assistant?.getBoundingClientRect().height,
      assistantRectTop: assistant?.getBoundingClientRect().top,
      assistantRectBottom: assistant?.getBoundingClientRect().bottom,
    };
  });
  console.log("METRICS 1440x900:", JSON.stringify(metrics, null, 2));

  // Notifications
  await page.click('button[aria-label*="Notifications"], button[aria-label*="notifications"]').catch(async () => {
    const btns = await page.locator("header button").all();
    console.log("header buttons count", btns.length);
  });
  await page.waitForTimeout(300);
  await shot(page, "03-1440x900-notifications-open");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // Assistant drawer
  const assistantBtn = page.locator("button", { hasText: /KneeGuide Assistant|مساعد KneeGuide/ }).first();
  await assistantBtn.click().catch((e) => errors.push("assistant click failed: " + e.message));
  await page.waitForTimeout(400);
  await shot(page, "04-1440x900-assistant-drawer-open");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // Account menu -> Arabic
  const avatarBtn = page.locator('button[aria-label*="Account"], button[aria-label*="account"], button[aria-label*="حساب"]').first();
  await avatarBtn.click().catch((e) => errors.push("avatar click failed: " + e.message));
  await page.waitForTimeout(300);
  await shot(page, "05-1440x900-account-menu-open");

  const arabicBtn = page.locator("button", { hasText: "العربية" }).first();
  await arabicBtn.click().catch((e) => errors.push("arabic click failed: " + e.message));
  await page.waitForTimeout(500);
  await shot(page, "06-1440x900-arabic-welcome-top");

  const scrollerHandleAr = await page.evaluateHandle(() => document.querySelector(".doctor-shell-content"));
  await page.evaluate((el) => { if (el) el.scrollTop = el.scrollHeight; }, scrollerHandleAr);
  await page.waitForTimeout(300);
  await shot(page, "07-1440x900-arabic-welcome-scrolled-bottom");

  await context.close();
}

// ---------- 1366x768 (common laptop) ----------
{
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await newDoctorPage(context);
  await page.goto(BASE + "/doctor/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "08-1366x768-welcome-top");
  await context.close();
}

// ---------- Tall viewport 1440x1300 ----------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1300 } });
  const page = await newDoctorPage(context);
  await page.goto(BASE + "/doctor/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "09-1440x1300-tall-welcome");
  await context.close();
}

// ---------- Narrower 1024x800 ----------
{
  const context = await browser.newContext({ viewport: { width: 1024, height: 800 } });
  const page = await newDoctorPage(context);
  await page.goto(BASE + "/doctor/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "10-1024x800-welcome");
  await context.close();
}

// ---------- Conversation mode check ----------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await newDoctorPage(context);
  await page.goto(BASE + "/doctor/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const chip = page.locator(".doctor-assistant-chip").first();
  await chip.click().catch((e) => errors.push("chip click failed: " + e.message));
  await page.waitForTimeout(700);
  await shot(page, "11-1440x900-conversation-mode");
  await context.close();
}

await browser.close();

fs.writeFileSync(`${OUT}\\errors.log`, errors.join("\n"));
console.log("=== CONSOLE/PAGE ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
