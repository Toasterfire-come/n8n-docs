import path from 'path';
import { fileURLToPath } from 'url';
import { launchBrowser, newPageWithCookies, uploadFileInput, cookiePath, saveCookies } from './common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function postToX({ text, imagePath }, opts = {}) {
  const browser = await launchBrowser(opts);
  const page = await newPageWithCookies(browser, cookiePath('x'), 'https://x.com/home');

  try {
    // Validate login by checking composer presence; if not present, let user log in once
    const composerSelector = 'div[aria-label="Post text"]:not([role="link"]) , div[aria-label="Tweet text"]';
    await page.waitForSelector('header', { timeout: 15000 });

    let composer;
    try {
      composer = await page.waitForSelector(composerSelector, { visible: true, timeout: 10000 });
    } catch {
      // Not logged in; navigate to login
      await page.goto('https://x.com/login', { waitUntil: 'networkidle2' });
      await page.waitForSelector('form[method="post"] input[name="text"]', { timeout: 60000 });
      console.log('Please log in to X in the opened browser...');
      await page.waitForSelector('div[aria-label="Tweet text"], div[aria-label="Post text"]', { timeout: 180000 });
      await saveCookies(page, 'x');
      composer = await page.$('div[aria-label="Tweet text"], div[aria-label="Post text"]');
    }

    // Click composer and type text
    await composer.click();
    await page.keyboard.type(text, { delay: 5 });

    if (imagePath) {
      // Open media upload via hidden input
      // X uses input[type=file][accept*="image"]
      const fileInputSelector = 'input[type="file"][accept*="image"]';
      let fileInput = await page.$(fileInputSelector);
      if (!fileInput) {
        // Click the media button to reveal
        const mediaButton = await page.$('div[aria-label="Add photos or video"], div[data-testid="fileInputButton"]');
        if (mediaButton) await mediaButton.click();
        fileInput = await page.waitForSelector(fileInputSelector, { visible: false, timeout: 10000 });
      }
      await fileInput.uploadFile(imagePath);
      // Wait for thumbnail
      await page.waitForSelector('[data-testid="tweetPhoto"], [aria-label*="Image"]', { timeout: 30000 });
    }

    // Click Post / Tweet button
    const postButtonSelector = 'div[data-testid="tweetButtonInline"], div[data-testid="tweetButton"]';
    await page.waitForSelector(postButtonSelector, { visible: true, timeout: 20000 });
    await page.click(postButtonSelector);

    // Confirm posted: snackbar or composer cleared
    await page.waitForTimeout(3000);
  } finally {
    await browser.close();
  }
}

export default postToX;
