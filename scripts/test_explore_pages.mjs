import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "docs/report 6/images/live_raw";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function explore() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  // 1. CLIENT CONTEXT
  console.log("=== Exploring Client Session ===");
  const clientContext = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const clientPage = await clientContext.newPage();

  await clientPage.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await clientPage.fill('input[name="email"]', "client@gmail.com");
  await clientPage.fill('input[name="password"]', "Client123!");
  await clientPage.click('button[type="submit"]');
  await clientPage.waitForTimeout(4000);

  const clientUrls = [
    { name: "forum_home", url: "http://localhost:3001/forum" },
    { name: "conversations", url: "http://localhost:3001/conversations" },
    { name: "notifications", url: "http://localhost:3001/notifications" },
    { name: "client_disputes", url: "http://localhost:3001/client/disputes" },
    { name: "client_contracts", url: "http://localhost:3001/client/contracts" },
  ];

  for (const item of clientUrls) {
    try {
      console.log(`Navigating to ${item.name} (${item.url})...`);
      await clientPage.goto(item.url, { waitUntil: "networkidle", timeout: 20000 });
      await clientPage.waitForTimeout(2000);
      const shot = path.join(OUT_DIR, `client_${item.name}.png`);
      await clientPage.screenshot({ path: shot });
      console.log(`Captured ${item.name} -> ${shot}`);
    } catch (e) {
      console.log(`Error on ${item.name}:`, e.message);
    }
  }

  // Check forum posts
  try {
    await clientPage.goto("http://localhost:3001/forum", { waitUntil: "networkidle" });
    await clientPage.waitForTimeout(2000);
    // Find post links
    const postLinks = await clientPage.$$eval('a[href*="/forum/"]', els => els.map(a => a.href));
    console.log("Forum post links found:", postLinks.slice(0, 5));
    if (postLinks.length > 0) {
      const targetPost = postLinks.find(l => l.split("/").length >= 6) || postLinks[0];
      console.log("Opening post detail:", targetPost);
      await clientPage.goto(targetPost, { waitUntil: "networkidle" });
      await clientPage.waitForTimeout(2000);
      await clientPage.screenshot({ path: path.join(OUT_DIR, "client_forum_post_detail.png") });
    }
  } catch (e) {
    console.log("Error opening forum post:", e.message);
  }

  // 2. ADMIN CONTEXT
  console.log("\n=== Exploring Admin Session ===");
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
  await adminPage.fill('input[name="email"]', "admin@gmail.com");
  await adminPage.fill('input[name="password"]', "Admin123!");
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(4000);

  const adminUrls = [
    { name: "admin_moderation", url: "http://localhost:3001/admin/moderation" },
    { name: "admin_trash", url: "http://localhost:3001/admin/trash" },
    { name: "admin_disputes", url: "http://localhost:3001/admin/disputes" },
    { name: "admin_posts", url: "http://localhost:3001/admin/posts" },
  ];

  for (const item of adminUrls) {
    try {
      console.log(`Navigating to ${item.name} (${item.url})...`);
      await adminPage.goto(item.url, { waitUntil: "networkidle", timeout: 20000 });
      await adminPage.waitForTimeout(2000);
      const shot = path.join(OUT_DIR, `${item.name}.png`);
      await adminPage.screenshot({ path: shot });
      console.log(`Captured ${item.name} -> ${shot}`);
    } catch (e) {
      console.log(`Error on ${item.name}:`, e.message);
    }
  }

  await browser.close();
  console.log("\nExploration completed!");
}

explore().catch(console.error);
