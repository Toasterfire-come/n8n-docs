import { launchBrowser, newPageWithCookies, cookiePath, saveCookies } from './common.js';

async function postToLinkedIn({ text, imagePath }, opts = {}) {
  const browser = await launchBrowser(opts);
  const page = await newPageWithCookies(browser, cookiePath('linkedin'), 'https://www.linkedin.com/feed/');
  try {
    // Detect composer; if not logged in, ask to login once and save cookies
    let composerButton;
    try {
      composerButton = await page.waitForSelector('button[aria-label="Start a post"], button.share-box-feed-entry__trigger', { timeout: 10000 });
    } catch {
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
      await page.waitForSelector('input#username', { timeout: 60000 });
      console.log('Please log in to LinkedIn in the opened browser...');
      await page.waitForSelector('button[aria-label="Start a post"], button.share-box-feed-entry__trigger', { timeout: 180000 });
      await saveCookies(page, 'linkedin');
      composerButton = await page.$('button[aria-label="Start a post"], button.share-box-feed-entry__trigger');
    }

    // Open composer modal
    await composerButton.click();
    const modal = await page.waitForSelector('div[role="dialog"]', { visible: true, timeout: 20000 });

    // Type text
    const editorSelector = 'div[role="textbox"][contenteditable="true"]';
    const editor = await page.waitForSelector(editorSelector, { visible: true, timeout: 20000 });
    await editor.click();
    await page.keyboard.type(text, { delay: 5 });

    // Attach image
    if (imagePath) {
      // Click media button (it opens file chooser)
      const mediaButtonSelector = 'button[aria-label*="Add a photo"], button[aria-label*="Photo"]';
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout: 15000 }),
        page.click(mediaButtonSelector)
      ]);
      await fileChooser.accept([imagePath]);

      // Wait for thumbnail in modal
      await page.waitForSelector('img[alt*="image"], div[aria-label*="image"]', { timeout: 30000 });
    }

    // Post
    const postButtonSelector = 'button[aria-label="Post"], button.share-actions__primary-action';
    await page.waitForSelector(postButtonSelector, { visible: true, timeout: 20000 });
    await page.click(postButtonSelector);

    await page.waitForTimeout(3000);
  } finally {
    await browser.close();
  }
}

export default postToLinkedIn;
