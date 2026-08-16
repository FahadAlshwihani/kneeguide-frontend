import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/shots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("i18nextLng", "ar");
}, { token: "fake", user: { id: 1, email: "s@k.com", first_name: "Sarah", last_name: "Ahmed", role: "doctor" } });
await page.goto("http://localhost:3000/doctor/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // long wait so the typewriter effect is definitely finished
await page.screenshot({ path: `${OUT}/arabic-longwait.png` });
await browser.close();
console.log("done");
