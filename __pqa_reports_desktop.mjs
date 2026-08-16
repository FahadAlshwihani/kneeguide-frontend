import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
await page.goto("http://localhost:3000/patient/reports", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const btn = page.locator(".session-history-view-btn:visible").first();
await btn.click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/reports-desktop-recovery-modal.png` });
console.log("done");
await browser.close();
