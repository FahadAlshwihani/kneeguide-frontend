import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
fs.mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";
const AUTH_USER = { id: 1, email: "amina.saleh@example.com", first_name: "Amina", last_name: "Saleh", role: "patient" };

const browser = await chromium.launch({ headless: true });
const errors = [];

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

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("saved", name);
}

const VIEWPORTS = {
  mobile320: { width: 320, height: 690 },
  mobile375: { width: 375, height: 812 },
  mobileShort: { width: 375, height: 568 },
  mobileTall: { width: 412, height: 932 },
  tabletPortrait: { width: 768, height: 1024 },
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1920, height: 1080 },
};

// ---------- Dashboard (Flow A) across viewport matrix ----------
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport: vp });
  const page = await newPatientPage(context);
  await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(4500); // let typewriter finish
  await shot(page, `dashboard-${name}`);
  const overflow = await page.evaluate(() => ({
    docWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    docHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  console.log(`dashboard-${name} overflow-check`, JSON.stringify(overflow));
  await context.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/errors.log`, errors.join("\n"));
console.log("=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
