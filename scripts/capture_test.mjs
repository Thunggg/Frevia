import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "docs/report 6/images/test_captures";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log("Launching Chrome via Playwright...");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 940 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  console.log("Navigating to http://localhost:3001/login...");
  try {
    await page.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded", timeout: 25000 });
  } catch (e) {
    console.log("Navigation note:", e.message);
  }

  await page.waitForTimeout(3000);
  const title = await page.title();
  console.log("Page title:", title);

  const shotPath = path.join(OUT_DIR, "login_test.png");
  await page.screenshot({ path: shotPath });
  console.log("Saved screenshot to:", shotPath);

  await browser.close();
}

run().catch(console.error);
