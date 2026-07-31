import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/veree/AppData/Roaming/nvm/v24.18.0/node_modules/puppeteer/lib/puppeteer/puppeteer.js');

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir   = 'temporary screenshots';

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Auto-increment filename
const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.replace('screenshot-','').replace(/\D.*$/,''))).filter(n => !isNaN(n));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath  = path.join(dir, filename);

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/veree/.cache/puppeteer/chrome/win64-151.0.7922.47/chrome-win64/chrome.exe',
  args: ['--no-sandbox','--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll through the page to trigger IntersectionObserver on all fade-in elements
await page.evaluate(async () => {
  await new Promise(resolve => {
    const distance = 200;
    const delay = 60;
    let scrolled = 0;
    const total = document.body.scrollHeight;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      scrolled += distance;
      if (scrolled >= total) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        setTimeout(resolve, 400);
      }
    }, delay);
  });
});

await new Promise(r => setTimeout(r, 600));

await page.screenshot({ path: outPath, fullPage: true });
console.log(`Screenshot saved: ${outPath}`);
await browser.close();
