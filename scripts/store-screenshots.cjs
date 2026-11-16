// Regenerates the Google Play phone screenshots in store-assets/ (1080x1920).
//
// Usage: start the app with `npm run dev` (needs VITE_SUPABASE_* in .env.local),
// then run `node scripts/store-screenshots.cjs`. Requires Playwright with Chromium
// (not a project dependency: `npx playwright install chromium` or a global install).
// The profile shot uses the built-in demo data (/profile?demo=true).
const path = require('node:path');
const { chromium } = require('playwright');
const launch = async (dsf = 1) => {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    ...(process.env.HTTPS_PROXY
      ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: dsf,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('ERR', m.text().slice(0, 200));
  });
  return { browser, context, page };
};
const mapIdle = async (page) => {
  await page.waitForFunction(() => !document.body.innerText.includes('Loading runestones'), null, {
    timeout: 90000,
  });
  await page.waitForTimeout(6000);
};

const dsf = 3; // 360x640 dp viewport -> 1080x1920 px (9:16)
const out = path.join(__dirname, '..', 'store-assets');
const QUERY = 'Täby';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:1420';
const moveMap = (page, center, zoom) =>
  page.evaluate(
    async ([center, zoom]) => {
      const { mapStore } = await import('/src/stores/mapStore.ts');
      const map = mapStore.mapInstance;
      map.jumpTo({ center, zoom });
      await new Promise((r) => map.once('idle', r));
    },
    [center, zoom],
  );
(async () => {
  const { browser, page } = await launch(dsf);
  const shot = async (name) => {
    await page.screenshot({ path: `${out}/${name}.png` });
    console.log('shot', name);
  };
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await mapIdle(page);
  await page
    .locator('.maplibregl-ctrl-attrib-button')
    .click()
    .catch(() => {});
  await page.evaluate(() => document.activeElement?.blur());

  // 1. clustered map north of Stockholm
  await moveMap(page, [18.02, 59.47], 10.3);
  await page.waitForTimeout(2500);
  await shot('screenshot-1-interactive-map');

  // 6. Scandinavia overview
  await moveMap(page, [12.6, 61.0], 3.9);
  await page.waitForTimeout(2500);
  await shot('screenshot-6-scandinavia-overview');

  // 4. search
  await moveMap(page, [18.07, 59.44], 12);
  await page.getByLabel('Open Menu').click();
  await page.getByPlaceholder('Search runestones...').fill(QUERY);
  await page.waitForFunction(() => /Found \d+ result/i.test(document.body.innerText), null, {
    timeout: 30000,
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(300);
  await shot('screenshot-4-search-and-filters');
  console.log(
    await page.evaluate(() =>
      [...document.querySelectorAll('.max-h-64 button')].map((b) =>
        b.innerText.replace(/\n/g, ' | '),
      ),
    ),
  );

  // 2. preview modal, opened from the first search result
  await page.locator('.max-h-64 button').filter({ hasText: 'U 135' }).first().click();
  await page.waitForSelector('text=View Full Page');
  await page.waitForTimeout(5000);
  await page.locator('img[alt^="Runestone"]').evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(800);
  await shot('screenshot-2-runestone-preview');

  // 3. details page
  await page.getByText('View Full Page').click();
  await page.waitForURL(/\/runestones\//);
  await page.waitForTimeout(6000);
  console.log(page.url());
  const scrollTo = (text, offset) =>
    page.evaluate(
      ([text, offset]) => {
        const sc = [...document.querySelectorAll('*')].find(
          (e) =>
            e.scrollHeight > e.clientHeight + 50 && getComputedStyle(e).overflowY !== 'visible',
        );
        const el = [...sc.querySelectorAll('*')].find(
          (e) =>
            e.children.length === 0 && e.textContent.trim().toLowerCase() === text.toLowerCase(),
        );
        if (!el)
          return (
            'not found: ' +
            [...sc.querySelectorAll('h1,h2,h3,div')]
              .filter((e) => e.children.length === 0 && e.textContent.trim().length < 40)
              .map((e) => e.textContent.trim())
              .join(' / ')
          );
        sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - offset;
        return 'ok';
      },
      [text, offset],
    );
  console.log(await scrollTo('Norse Text', 70));
  await page.waitForTimeout(1500);
  await shot('screenshot-3-runestone-details');

  // 5. profile (built-in demo data)
  await page.goto(`${BASE}/profile?demo=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log(await scrollTo('Adventure Progress', 90));
  await page.waitForTimeout(1000);
  await shot('screenshot-5-profile-and-gpx-export');
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
