import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require(`${process.env.USERPROFILE}/AppData/Roaming/nvm/v24.18.0/node_modules/puppeteer/lib/puppeteer/puppeteer.js`);
import fs from 'fs';

const browser = await puppeteer.launch({
  executablePath: `${process.env.USERPROFILE}/.cache/puppeteer/chrome/win64-151.0.7922.47/chrome-win64/chrome.exe`,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

// scroll to trigger observers
await page.evaluate(async () => {
  await new Promise(resolve => {
    let s = 0;
    const t = setInterval(() => {
      window.scrollBy(0, 300);
      s += 300;
      if (s >= document.body.scrollHeight) {
        clearInterval(t);
        window.scrollTo(0, 0);
        setTimeout(resolve, 400);
      }
    }, 80);
  });
});
await new Promise(r => setTimeout(r, 600));

// Get actual section positions
const positions = await page.evaluate(() => {
  const ids = ['mission', 'services', 'team', 'referrals', 'contact', 'location'];
  const result = { pageHeight: document.body.scrollHeight };
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      result[id] = Math.round(window.scrollY + rect.top);
    }
  });
  return result;
});

console.log('Section positions:', JSON.stringify(positions, null, 2));

// Hero (top of page)
await page.screenshot({ path: 'temporary screenshots/section-hero.png',     clip: { x:0, y:0,                         width:1440, height:620 } });
await page.screenshot({ path: 'temporary screenshots/section-mission.png',  clip: { x:0, y:positions.mission  || 620,  width:1440, height:580 } });
await page.screenshot({ path: 'temporary screenshots/section-services.png', clip: { x:0, y:positions.services  || 1200, width:1440, height:700 } });
await page.screenshot({ path: 'temporary screenshots/section-team.png',     clip: { x:0, y:positions.team      || 1900, width:1440, height:580 } });
await page.screenshot({ path: 'temporary screenshots/section-creds.png',    clip: { x:0, y:positions.referrals  || 2480, width:1440, height:500 } });
await page.screenshot({ path: 'temporary screenshots/section-form.png',     clip: { x:0, y:positions.contact   || 2980, width:1440, height:760 } });
await page.screenshot({ path: 'temporary screenshots/section-footer.png',   clip: { x:0, y:positions.pageHeight - 280, width:1440, height:280 } });

console.log('All section screenshots saved.');
await browser.close();
