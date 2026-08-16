import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/authshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 900, height: 900 } });
const page = await context.newPage();
await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator(".header-lang-toggle--topbar").click();
await page.waitForTimeout(400);
await page.setViewportSize({ width: 320, height: 900 });
await page.waitForTimeout(200);
await page.locator(".demo-access-trigger").click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/13-rtl-320-retest.png` });
const overflow = await page.evaluate(() => ({
  docScrollWidth: document.documentElement.scrollWidth,
  docClientWidth: document.documentElement.clientWidth,
}));
console.log("overflow:", JSON.stringify(overflow));
await browser.close();
console.log("done");
