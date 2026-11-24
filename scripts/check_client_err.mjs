import { chromium } from "playwright";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function checkClient() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/login");
  await page.fill('input[name="email"]', "client@gmail.com");
  await page.fill('input[name="password"]', "Client123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  const bodyText = await page.innerText("body");
  console.log("Current URL:", page.url());
  const errorElements = await page.$$eval('[data-invalid="true"], [role="status"], [role="alert"], .text-destructive, [data-sonner-toast]', els => els.map(e => e.innerText));
  console.log("Errors / Toasts:", errorElements);

  await browser.close();
}

checkClient().catch(console.error);
