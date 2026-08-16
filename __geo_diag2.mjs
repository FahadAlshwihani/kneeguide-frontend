import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 320, height: 690 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });

await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator(".pfl-segmented-option, .pfl-tabs button").nth(4).click();
await page.waitForTimeout(300);
await page.locator("button", { hasText: "العربية" }).first().click();
await page.waitForTimeout(400);

await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(4500);

// Click "Show today's exercises" suggestion chip
const chip = page.locator(".patient-assistant-chip", { hasText: "عرض تمارين اليوم" }).first();
await chip.click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/geo-02-after-todays-exercises-chip.png` });
console.log("URL after click:", page.url());

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1500));
console.log("--- AFTER CLICK TEXT ---");
console.log(bodyText);

// look for any info-style buttons inside the conversation turn
const infoButtons = await page.locator("button[aria-label*='تفاصيل'], button[aria-label*='التمرين'], .exercise-info-button").count();
console.log("info-like buttons found:", infoButtons);

await context.close();
await browser.close();
