import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export async function launchBrowser(options = {}) {
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: options.network ? launchArgs : [],
  });
  return browser;
}

export async function newPageWithCookies(browser, cookieFilePath, url) {
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  if (cookieFilePath && fs.existsSync(cookieFilePath)) {
    const cookies = readJsonSafe(cookieFilePath) || [];
    if (cookies.length) {
      await page.setCookie(...cookies);
    }
  }
  if (url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
  }
  return page;
}

export async function uploadFileInput(page, selector, filePath) {
  const input = await page.waitForSelector(selector, { visible: true });
  await input.uploadFile(filePath);
}

export function cookiePath(name) {
  return path.join(__dirname, '..', 'cookies', `${name}.json`);
}

export async function saveCookies(page, name) {
  const client = await page.target().createCDPSession();
  const { cookies } = await client.send('Network.getAllCookies');
  fs.writeFileSync(cookiePath(name), JSON.stringify(cookies, null, 2));
}
