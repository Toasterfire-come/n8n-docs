#!/usr/bin/env node
import { launchBrowser, saveCookies } from '../src/common.js';

(async () => {
  const browser = await launchBrowser({ network: true });
  const page = await browser.newPage();
  await page.goto('https://x.com/login', { waitUntil: 'networkidle2' });
  console.log('Log in to X, then press Enter here...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', async () => {
    await saveCookies(page, 'x');
    console.log('Saved cookies to cookies/x.json');
    await browser.close();
    process.exit(0);
  });
})();
