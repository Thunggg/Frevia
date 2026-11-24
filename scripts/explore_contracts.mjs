import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "docs/report 6/images/live_raw";

async function exploreContracts() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const page = await context.newPage();

  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', "client@gmail.com");
  await page.fill('input[name="password"]', "Client123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto("http://localhost:3001/client/contracts", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Look for contract cards or table rows
  const contractLinks = await page.$$eval('a[href*="/contracts/"], a[href*="/client/contracts/"]', els => els.map(a => a.href));
  console.log("Contract links found:", contractLinks);

  if (contractLinks.length > 0) {
    console.log("Navigating to first contract:", contractLinks[0]);
    await page.goto(contractLinks[0], { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, "client_contract_detail.png") });
    console.log("Captured client_contract_detail.png");

    // Look for dispute buttons or tabs
    const tabs = await page.$$eval('button, a', els => els.map(e => e.innerText.trim()).filter(t => t.length > 0));
    console.log("Interactive elements on contract detail:", tabs.slice(0, 20));
  }

  // Also check admin disputes detail
  console.log("\nChecking Admin Dispute details...");
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await adminPage.fill('input[name="email"]', "admin@gmail.com");
  await adminPage.fill('input[name="password"]', "Admin123!");
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(3000);

  await adminPage.goto("http://localhost:3001/admin/disputes", { waitUntil: "networkidle" });
  await adminPage.waitForTimeout(2000);
  const adminDisputeLinks = await adminPage.$$eval('a[href*="/admin/disputes/"]', els => els.map(a => a.href));
  console.log("Admin dispute links found:", adminDisputeLinks);
  if (adminDisputeLinks.length > 0) {
    console.log("Opening admin dispute:", adminDisputeLinks[0]);
    await adminPage.goto(adminDisputeLinks[0], { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(2500);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "admin_dispute_detail.png") });
    console.log("Captured admin_dispute_detail.png");
  }

  await browser.close();
}

exploreContracts().catch(console.error);
