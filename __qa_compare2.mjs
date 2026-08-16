import { chromium } from "playwright";
const OUT = "C:\\Users\\DELL\\AppData\\Local\\Temp\\claude\\c--Users-DELL-Projects-kneeguide-frontend\\2b5dc5a7-5b31-4a64-a190-ab5442cd64f4\\scratchpad\\shots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1300 } });
const page = await context.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await page.evaluate(({ token, user }) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}, { token: "fake", user: { id: 1, email: "s@k.com", first_name: "Sarah", last_name: "Ahmed", role: "doctor" } });
await page.goto("http://localhost:3000/doctor/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const info = await page.evaluate(() => {
  const all = document.querySelectorAll(".doctor-assistant");
  const results = [];
  all.forEach((el, i) => {
    el.style.outline = "4px solid red";
    const r = el.getBoundingClientRect();
    results.push({ i, top: r.top, bottom: r.bottom, connected: el.isConnected, visibility: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity, position: getComputedStyle(el).position });
  });
  return { count: all.length, results, scrollY: window.scrollY, docScrollTop: document.documentElement.scrollTop, shellContentScrollTop: document.querySelector(".doctor-shell-content")?.scrollTop };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: `${OUT}\\outline-check.png` });
await browser.close();
