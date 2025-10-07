#!/usr/bin/env node
import { launchBrowser, saveCookies } from '../src/common.js';

(async () => {
  const browser = await launchBrowser({ network: true });
  const page = await browser.newPage();
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
  console.log('Log in to LinkedIn, then press Enter here...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', async () => {
    await saveCookies(page, 'linkedin');
    console.log('Saved cookies to cookies/linkedin.json');
    await browser.close();
    process.exit(0);
  });
})();
