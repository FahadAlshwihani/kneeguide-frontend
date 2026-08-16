import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();
page.on("console", (m) => console.log("[console]", m.type(), m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
await page.goto("http://localhost:3000/patient/reports", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const viewBtns = document.querySelectorAll(".session-history-view-btn");
  const cardBtns = document.querySelectorAll(".session-history-card-btn");
  const cs = (el) => el ? getComputedStyle(el).display : "N/A";
  return {
    viewBtnCount: viewBtns.length,
    cardBtnCount: cardBtns.length,
    firstViewBtnDisplay: cs(viewBtns[0]),
    firstCardBtnDisplay: cs(cardBtns[0]),
    bodyScrollHeight: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(info, null, 2));

const btn = page.locator(".session-history-card-btn:visible").first();
const btnCount = await btn.count();
console.log("visible card btn count:", btnCount);
if (btnCount) {
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/reports-mobile-recovery-modal-v2.png` });
  console.log("clicked and screenshotted");
}
await browser.close();
