import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const browser = await chromium.launch({ headless: true });

async function auth(page) {
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });
}

for (const width of [320, 360, 375, 390, 412, 430]) {
  const context = await browser.newContext({ viewport: { width, height: 812 } });
  const page = await context.newPage();
  await auth(page);
  await page.goto("http://localhost:3000/patient/exercises", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // Switch to Library tab
  await page.locator(".pe-tab", { hasText: /Library|Exercise/i }).last().click().catch(() => {});
  await page.waitForTimeout(300);

  const infoBtnCount = await page.locator(".exercise-info-button").count();
  console.log(`--- LIBRARY width=${width}, found ${infoBtnCount} exercise-info-buttons ---`);

  for (let i = 0; i < infoBtnCount; i++) {
    await page.locator(".exercise-info-button").nth(i).click();
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => ({
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      panelScrollWidth: document.querySelector(".exercise-details-panel")?.scrollWidth,
      panelClientWidth: document.querySelector(".exercise-details-panel")?.clientWidth,
      title: document.querySelector(".exercise-details-title")?.textContent,
      hasVideo: !!document.querySelector(".exercise-details-media iframe"),
    }));
    const overflow = info.docScrollWidth > info.docClientWidth;
    const panelOverflow = info.panelScrollWidth > info.panelClientWidth;
    console.log(`  [${i}] "${info.title}" video:${info.hasVideo} doc:${info.docScrollWidth}/${info.docClientWidth}${overflow ? " *** DOC OVERFLOW ***" : ""} panel:${info.panelScrollWidth}/${info.panelClientWidth}${panelOverflow ? " *** PANEL OVERFLOW ***" : ""}`);
    if (overflow || panelOverflow) {
      await page.screenshot({ path: `${OUT}/overflow-BUG-library-w${width}-i${i}.png` });
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
  await context.close();
}
await browser.close();
console.log("done");
