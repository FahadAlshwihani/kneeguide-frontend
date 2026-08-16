import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 320, height: 690 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("[console error]", m.text()); });

await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });

// Switch to Arabic via Profile > Preferences first (established mechanism)
await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator(".pfl-segmented-option, .pfl-tabs button").nth(4).click();
await page.waitForTimeout(300);
await page.locator("button", { hasText: "العربية" }).first().click();
await page.waitForTimeout(400);

// Go to Dashboard (Patient Home / "Today's rehabilitation program" per the user's described path)
await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
await page.screenshot({ path: `${OUT}/geo-01-dashboard-ar-320.png` });

// The user describes reaching Exercise Details from "Today's rehabilitation program" on
// the Dashboard — check if such a link/action exists there (Assistant suggestion chip),
// vs. the Exercises page's own info buttons (the ONLY reachable trigger I previously found).
const dashboardHtml = await page.evaluate(() => document.body.innerText.slice(0, 2000));
console.log("--- DASHBOARD TEXT SNAPSHOT ---");
console.log(dashboardHtml);

await context.close();
await browser.close();
