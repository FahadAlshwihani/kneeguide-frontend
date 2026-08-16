import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/shots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "s@k.com", first_name: "Sarah", last_name: "Ahmed", role: "doctor" } });
await page.goto("http://localhost:3000/doctor/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const avatarBtn = page.locator('button[aria-label*="Account"], button[aria-label*="account"]').first();
await avatarBtn.click();
await page.waitForTimeout(300);
const arabicBtn = page.locator("button", { hasText: "العربية" }).first();
await arabicBtn.click();
await page.waitForTimeout(5000); // long wait: let the ~155-char typewriter (26ms/char ~= 4s) fully finish
await page.screenshot({ path: `${OUT}/arabic-full-top.png` });

// Notifications in Arabic
const bellBtn = page.locator('button[aria-label*="Notification"], button[aria-label*="notification"], button[aria-label*="إشعار"]').first();
await bellBtn.click().catch(() => {});
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/arabic-notifications.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

// Assistant drawer in Arabic
const assistantBtn = page.locator("button", { hasText: /KneeGuide Assistant|مساعد KneeGuide/ }).first();
await assistantBtn.click().catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/arabic-assistant-drawer.png` });

await browser.close();
console.log("done");
