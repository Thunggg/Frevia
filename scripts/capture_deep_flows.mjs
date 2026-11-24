import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "docs/report 6/images/live_raw";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function captureDeep() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  // 1. CLIENT CONTEXT
  console.log("=== Client Deep Captures ===");
  const clientContext = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const clientPage = await clientContext.newPage();

  await clientPage.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await clientPage.fill('input[name="email"]', "client@gmail.com");
  await clientPage.fill('input[name="password"]', "Client123!");
  await clientPage.click('button[type="submit"]');
  await clientPage.waitForTimeout(3000);

  // A. Forum create post dialog
  try {
    console.log("Navigating to /forum to open Create Talk Dialog...");
    await clientPage.goto("http://localhost:3001/forum", { waitUntil: "networkidle" });
    await clientPage.waitForTimeout(2000);
    // Find button to create talk: button containing "Create" or "Tạo" or "+"
    const createBtn = await clientPage.$('button:has-text("Create"), button:has-text("Tạo"), button:has-text("New")');
    if (createBtn) {
      console.log("Clicking create post button...");
      await createBtn.click();
      await clientPage.waitForTimeout(1500);
      await clientPage.screenshot({ path: path.join(OUT_DIR, "client_forum_create_dialog.png") });
      console.log("Captured client_forum_create_dialog.png");
    }
  } catch (e) {
    console.log("Error in create dialog:", e.message);
  }

  // B. Forum post detail & comments & report modal
  try {
    const postUrl = "http://localhost:3001/forum/design-creative-3/this-company-has-the-worst-customer-service-i-have-ever-experienced-1794101348623-w34kw-40";
    console.log("Navigating to post detail:", postUrl);
    await clientPage.goto(postUrl, { waitUntil: "networkidle" });
    await clientPage.waitForTimeout(2000);
    await clientPage.screenshot({ path: path.join(OUT_DIR, "client_forum_post_detail.png") });
    console.log("Captured client_forum_post_detail.png");

    // Scroll to comments
    await clientPage.evaluate(() => window.scrollBy(0, 600));
    await clientPage.waitForTimeout(1000);
    await clientPage.screenshot({ path: path.join(OUT_DIR, "client_forum_comments.png") });
    console.log("Captured client_forum_comments.png");

    // Try finding report button / icon
    const reportBtn = await clientPage.$('button:has-text("Report"), button:has-text("Báo cáo"), [aria-label*="report" i], [aria-label*="Report" i]');
    if (reportBtn) {
      console.log("Clicking report button...");
      await reportBtn.click();
      await clientPage.waitForTimeout(1500);
      await clientPage.screenshot({ path: path.join(OUT_DIR, "client_report_modal.png") });
      console.log("Captured client_report_modal.png");
    } else {
      // Look for dropdown menu trigger or more horizontal
      const moreBtn = await clientPage.$('button:has([class*="lucide-more"]), button:has([class*="lucide-ellipsis"])');
      if (moreBtn) {
        await moreBtn.click();
        await clientPage.waitForTimeout(500);
        const reportMenu = await clientPage.$('div[role="menuitem"]:has-text("Report"), div[role="menuitem"]:has-text("Báo cáo")');
        if (reportMenu) {
          await reportMenu.click();
          await clientPage.waitForTimeout(1000);
          await clientPage.screenshot({ path: path.join(OUT_DIR, "client_report_modal.png") });
          console.log("Captured client_report_modal.png from menu");
        }
      }
    }
  } catch (e) {
    console.log("Error in post detail/report:", e.message);
  }

  // C. Client Disputes / Contracts Deep Dive
  try {
    console.log("Checking client disputes list...");
    await clientPage.goto("http://localhost:3001/client/disputes", { waitUntil: "networkidle" });
    await clientPage.waitForTimeout(2000);
    await clientPage.screenshot({ path: path.join(OUT_DIR, "client_disputes_list.png") });

    // Look for dispute row link
    const disputeLink = await clientPage.$('a[href*="/disputes/"], a[href*="/client/disputes/"]');
    if (disputeLink) {
      console.log("Found dispute link, clicking...");
      await disputeLink.click();
      await clientPage.waitForTimeout(2500);
      await clientPage.screenshot({ path: path.join(OUT_DIR, "client_dispute_detail.png") });
      console.log("Captured client_dispute_detail.png");
    }
  } catch (e) {
    console.log("Error in client disputes:", e.message);
  }

  // 2. ADMIN CONTEXT
  console.log("\n=== Admin Deep Captures ===");
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await adminPage.fill('input[name="email"]', "admin@gmail.com");
  await adminPage.fill('input[name="password"]', "Admin123!");
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(3000);

  // Admin moderation detail
  try {
    console.log("Navigating to /admin/moderation...");
    await adminPage.goto("http://localhost:3001/admin/moderation", { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "admin_moderation_queue.png") });
  } catch (e) {
    console.log("Error in admin moderation:", e.message);
  }

  // Admin trash
  try {
    console.log("Navigating to /admin/trash...");
    await adminPage.goto("http://localhost:3001/admin/trash", { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "admin_trash_bin.png") });
  } catch (e) {
    console.log("Error in admin trash:", e.message);
  }

  // Admin disputes
  try {
    console.log("Navigating to /admin/disputes...");
    await adminPage.goto("http://localhost:3001/admin/disputes", { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(OUT_DIR, "admin_disputes_overview.png") });

    const adminDisputeItem = await adminPage.$('a[href*="/admin/disputes/"], button:has-text("View"), button:has-text("Detail")');
    if (adminDisputeItem) {
      console.log("Clicking admin dispute item...");
      await adminDisputeItem.click();
      await adminPage.waitForTimeout(2500);
      await adminPage.screenshot({ path: path.join(OUT_DIR, "admin_dispute_dossier.png") });
      console.log("Captured admin_dispute_dossier.png");
    }
  } catch (e) {
    console.log("Error in admin disputes:", e.message);
  }

  await browser.close();
  console.log("\nDeep captures completed!");
}

captureDeep().catch(console.error);
