import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/shots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1300 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "s@k.com", first_name: "Sarah", last_name: "Ahmed", role: "doctor" } });
await page.goto("http://localhost:3000/doctor/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

await page.evaluate(() => {
  const ruler = document.createElement("div");
  ruler.style.cssText = "position:fixed;top:0;left:0;width:40px;height:100%;z-index:999999;pointer-events:none;";
  for (let y = 0; y <= 1300; y += 100) {
    const tick = document.createElement("div");
    tick.style.cssText = `position:absolute;top:${y}px;left:0;width:40px;border-top:1px solid lime;color:lime;font-size:10px;font-family:monospace;background:black;`;
    tick.textContent = String(y);
    ruler.appendChild(tick);
  }
  document.body.appendChild(ruler);

  const el = document.querySelector(".doctor-assistant");
  if (el) {
    const r = el.getBoundingClientRect();
    const box = document.createElement("div");
    box.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;border:3px solid magenta;z-index:999998;pointer-events:none;box-sizing:border-box;`;
    document.body.appendChild(box);
  }
});
await page.waitForTimeout(100);
await page.screenshot({ path: `${OUT}/ruler-check-1440x1300.png` });
await browser.close();
console.log("done");
