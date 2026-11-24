import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "docs/report 6/images/test_captures";

async function findMilestones() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const page = await context.newPage();

  await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', "client@gmail.com");
  await page.fill('input[name="password"]', "Client123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Navigate to contracts
  await page.goto("http://localhost:3001/client/contracts/contract-ui-ux-mwtkhrss-14aeb", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Look for milestone links or tabs
  const milestoneLinks = await page.$$eval('a[href*="/milestones/"]', els => els.map(a => a.href));
  console.log("Milestone links found on contract:", milestoneLinks);

  // Also check all contracts to find funded milestones
  if (milestoneLinks.length === 0) {
    // Check other contracts
    const allContracts = [
      "http://localhost:3001/client/contracts/contract-ui-ux-designer-needed-for-freelance-marketplace-mwtjscm2-h255u",
      "http://localhost:3001/client/contracts/contract-senior-full-stack-developer-react-node-js-cloud-mwkf0jdf-8u68z",
      "http://localhost:3001/client/contracts/contract-10",
      "http://localhost:3001/client/contracts/contract-9"
    ];
    for (const cUrl of allContracts) {
      await page.goto(cUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const links = await page.$$eval('a[href*="/milestones/"]', els => els.map(a => a.href));
      if (links.length > 0) {
        console.log(`Milestones found on ${cUrl}:`, links);
        milestoneLinks.push(...links);
        break;
      }
    }
  }

  if (milestoneLinks.length > 0) {
    console.log("Navigating to milestone page:", milestoneLinks[0]);
    await page.goto(milestoneLinks[0], { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, "milestone_page_live.png") });
    console.log("Captured milestone_page_live.png");

    // Look for Open Dispute button
    const disputeBtn = await page.$('button:has-text("Dispute"), button:has-text("Tranh chấp"), button:has-text("Khiếu nại"), button:has([class*="lucide-scale"])');
    if (disputeBtn) {
      console.log("Found dispute button! Clicking it...");
      await disputeBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT_DIR, "milestone_dispute_dialog_live.png") });
      console.log("Captured milestone_dispute_dialog_live.png!");
    } else {
      console.log("Dispute button not directly visible, checking page text...");
      const text = await page.innerText("body");
      console.log("Milestone page status snippet:", text.slice(0, 300));
    }
  }

  await browser.close();
}

findMilestones().catch(console.error);
