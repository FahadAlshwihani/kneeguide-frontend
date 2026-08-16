import { chromium } from "playwright";
const OUT = "C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Projects-kneeguide-frontend/2b5dc5a7-5b31-4a64-a190-ab5442cd64f4/scratchpad/pshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });

async function run(width, label) {
  const context = await browser.newContext({ viewport: { width, height: 690 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[${label}][pageerror]`, e.message));

  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: "fake", user: { id: 1, email: "a@k.com", first_name: "Amina", last_name: "Saleh", role: "patient" } });

  await page.goto(BASE + "/patient/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator(".pfl-segmented-option, .pfl-tabs button").nth(4).click();
  await page.waitForTimeout(300);
  await page.locator("button", { hasText: "العربية" }).first().click();
  await page.waitForTimeout(400);

  await page.goto(BASE + "/patient/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);
  const chip = page.locator(".patient-assistant-chip", { hasText: "عرض تمارين اليوم" }).first();
  await chip.click();
  await page.waitForTimeout(1000);
  // Follow the exact path the user described: click through to the exercise program, then open details
  await page.locator("button, a", { hasText: "فتح برنامج التمارين" }).first().click().catch((e) => console.log("open-program click failed:", e.message));
  await page.waitForTimeout(800);
  console.log(`[${label}] URL after opening program:`, page.url());

  const infoBtn = page.locator(".exercise-info-button").first();
  const infoCount = await page.locator(".exercise-info-button").count();
  console.log(`[${label}] exercise-info-button count:`, infoCount);
  if (infoCount === 0) {
    await page.screenshot({ path: `${OUT}/geo-noinfo-${label}.png` });
    await context.close();
    return;
  }
  await infoBtn.click();
  await page.waitForTimeout(600);

  const geo = await page.evaluate(() => {
    const panel = document.querySelector(".exercise-details-panel");
    const backdrop = document.querySelector(".patient-dialog-backdrop");
    const closeBtn = document.querySelector(".exercise-details-panel .patient-dialog-close");
    const rect = (el) => el ? (({ left, right, width, top, bottom, height }) => ({ left, right, width, top, bottom, height }))(el.getBoundingClientRect()) : null;

    // Walk ancestor chain from panel up to <body>, capturing layout-relevant computed styles
    const chain = [];
    let el = panel;
    while (el && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      chain.push({
        tag: el.tagName,
        class: el.className,
        position: cs.position,
        transform: cs.transform,
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        width: cs.width,
        maxWidth: cs.maxWidth,
        minWidth: cs.minWidth,
        marginInlineStart: cs.marginInlineStart,
        marginInlineEnd: cs.marginInlineEnd,
        paddingInlineStart: cs.paddingInlineStart,
        paddingInlineEnd: cs.paddingInlineEnd,
        insetInlineStart: cs.insetInlineStart,
        insetInlineEnd: cs.insetInlineEnd,
        left: cs.left,
        right: cs.right,
        rect: rect(el),
      });
      el = el.parentElement;
    }

    return {
      windowInnerWidth: window.innerWidth,
      docDir: document.documentElement.dir,
      panelRect: rect(panel),
      backdropRect: rect(backdrop),
      closeBtnRect: rect(closeBtn),
      panelComputed: panel ? {
        width: getComputedStyle(panel).width,
        maxWidth: getComputedStyle(panel).maxWidth,
        marginInlineStart: getComputedStyle(panel).marginInlineStart,
        marginInlineEnd: getComputedStyle(panel).marginInlineEnd,
        boxSizing: getComputedStyle(panel).boxSizing,
        transform: getComputedStyle(panel).transform,
      } : null,
      ancestorChain: chain,
    };
  });
  console.log(`[${label}] === GEOMETRY ===`);
  console.log(JSON.stringify(geo, null, 2));

  await page.screenshot({ path: `${OUT}/geo-${label}.png` });
  await context.close();
}

await run(320, "ar-320");
await browser.close();
console.log("done");
