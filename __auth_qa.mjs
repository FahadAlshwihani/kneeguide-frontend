import { chromium } from "playwright";
import fs from "node:fs";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/authshots";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";
const errors = [];
const browser = await chromium.launch({ headless: true });

async function shot(page, name) { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("saved", name); }

// ---------- Desktop LTR: Login collapsed -> expanded -> use demo -> copy ----------
{
  const context = await browser.newContext({ viewport: { width: 480, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "01-login-collapsed");

  const trigger = page.locator(".demo-access-trigger");
  const expandedBefore = await trigger.getAttribute("aria-expanded");
  console.log("aria-expanded before:", expandedBefore);

  await trigger.click();
  await page.waitForTimeout(400);
  await shot(page, "02-login-expanded");
  const expandedAfter = await trigger.getAttribute("aria-expanded");
  console.log("aria-expanded after:", expandedAfter);

  // Use Patient Demo
  await page.locator(".demo-use-account-btn").first().click();
  await page.waitForTimeout(200);
  const emailVal = await page.locator("#login-email").inputValue();
  const pwVal = await page.locator("#login-password").inputValue();
  console.log("After Use Patient Demo -> email:", emailVal, "| password:", pwVal);
  await shot(page, "03-login-patient-filled");

  // confirm no auto-submit happened (still on /login)
  console.log("URL after Use Patient Demo:", page.url());

  // Use Doctor Demo
  await page.locator(".demo-use-account-btn").nth(1).click();
  await page.waitForTimeout(200);
  const emailVal2 = await page.locator("#login-email").inputValue();
  const pwVal2 = await page.locator("#login-password").inputValue();
  console.log("After Use Doctor Demo -> email:", emailVal2, "| password:", pwVal2);
  console.log("URL after Use Doctor Demo:", page.url());

  // Copy button feedback
  const copyBtn = page.locator(".demo-copy-btn").first();
  await copyBtn.click();
  await page.waitForTimeout(300);
  await shot(page, "04-login-copy-feedback");
  const liveRegionText = await page.locator("[aria-live='polite']").textContent();
  console.log("aria-live announcement:", JSON.stringify(liveRegionText));
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => "read-failed: " + e.message);
  console.log("actual clipboard content:", clipboardContent);
  const checkIconVisible = await page.locator(".demo-copy-btn").first().locator("svg").count();
  console.log("copy btn icon count (check or copy):", checkIconVisible);

  // Collapse/reopen — check for AuthCard blank/flicker
  await trigger.click(); // collapse
  await page.waitForTimeout(350);
  await shot(page, "05-login-collapsed-again");
  const cardVisible = await page.locator(".auth-card").isVisible();
  console.log("AuthCard visible after collapse:", cardVisible);
  await trigger.click(); // reopen
  await page.waitForTimeout(350);
  await shot(page, "06-login-reexpanded");

  await context.close();
}

// ---------- Mobile 320 / 430, LTR ----------
for (const width of [320, 430]) {
  const context = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await context.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator(".demo-access-trigger").click();
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
  }));
  console.log(`mobile ${width}px overflow check:`, JSON.stringify(overflow), overflow.docScrollWidth > overflow.docClientWidth ? "*** OVERFLOW ***" : "OK");
  await shot(page, `07-login-mobile-${width}-expanded`);
  await context.close();
}

// ---------- Arabic RTL: Login (switch via desktop topbar toggle, then resize) ----------
for (const width of [375, 320]) {
  const context = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`[rtl-${width} pageerror] ` + e.message));
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator(".header-lang-toggle--topbar").click();
  await page.waitForTimeout(400);
  const dir = await page.evaluate(() => document.documentElement.dir);
  console.log(`[w${width}] doc dir after language toggle:`, dir);

  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(200);
  await shot(page, `08-login-rtl-w${width}-collapsed`);

  await page.locator(".demo-access-trigger").click();
  await page.waitForTimeout(400);
  await shot(page, `09-login-rtl-w${width}-expanded`);
  const overflow = await page.evaluate(() => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
  }));
  console.log(`[w${width}] RTL overflow:`, JSON.stringify(overflow), overflow.docScrollWidth > overflow.docClientWidth ? "*** OVERFLOW ***" : "OK");

  const valueDir = await page.evaluate(() => document.querySelector(".demo-credential-value")?.getAttribute("dir"));
  console.log(`[w${width}] credential value dir attr:`, valueDir);

  await context.close();
}

// ---------- Register: role-aware hint ----------
{
  const context = await browser.newContext({ viewport: { width: 480, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push("[register pageerror] " + e.message));
  await page.goto(BASE + "/register", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "10-register-no-role");
  const hintCountBefore = await page.locator(".register-role-hint").count();
  console.log("register-role-hint count before role select:", hintCountBefore);

  await page.locator(".role-card").first().click(); // Patient
  await page.waitForTimeout(250);
  await shot(page, "11-register-patient-role");
  console.log("hint text (patient):", await page.locator(".register-role-hint").textContent());

  await page.locator(".role-card").nth(1).click(); // Doctor
  await page.waitForTimeout(250);
  await shot(page, "12-register-doctor-role");
  console.log("hint text (doctor):", await page.locator(".register-role-hint").textContent());
  const hintCountAfter = await page.locator(".register-role-hint").count();
  console.log("register-role-hint count with doctor selected (should be 1, not both):", hintCountAfter);

  // click the Login link from the doctor hint, verify it navigates correctly
  await page.locator(".register-role-hint .auth-switch-link").click();
  await page.waitForTimeout(400);
  console.log("URL after clicking Login link from doctor hint:", page.url());

  await context.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/errors.log`, errors.join("\n"));
console.log("=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "(none)");
