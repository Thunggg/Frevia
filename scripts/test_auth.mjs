import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "docs/report 6/images/real_captures";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function testAuth() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const page = await context.newPage();

  console.log("Testing client login...");
  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle", timeout: 20000 });
  await page.fill('input[name="email"]', "client@gmail.com");
  await page.fill('input[name="password"]', "Client123!");
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  console.log("Client post-login URL:", page.url());
  await page.screenshot({ path: path.join(OUT_DIR, "client_logged_in.png") });

  console.log("Testing admin login in new context...");
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto("http://localhost:3001/login", { waitUntil: "networkidle", timeout: 20000 });
  await adminPage.fill('input[name="email"]', "admin@gmail.com");
  await adminPage.fill('input[name="password"]', "Admin123!");
  await adminPage.click('button[type="submit"]');

  await adminPage.waitForTimeout(4000);
  console.log("Admin post-login URL:", adminPage.url());
  await adminPage.screenshot({ path: path.join(OUT_DIR, "admin_logged_in.png") });

  await browser.close();
}

testAuth().catch(console.error);
