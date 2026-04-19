#!/usr/bin/env node
/**
 * scrape-paywall-screens.mjs
 *
 * Playwright-based scraper for www.paywallscreens.com.
 * Crawls the homepage (which renders all apps client-side via infinite scroll)
 * and outputs a sorted JSON file for use as the app's bundled data source.
 *
 * Usage:
 *   node scripts/scrape-paywall-screens.mjs
 *
 * Requirements:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * This script is used by:
 *   - Developers: manually refresh data
 *   - GitHub Actions: weekly cron job to keep data fresh
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../public/data/top-apps.json');
const SCROLL_ITERATIONS = 5;
const SCROLL_DELAY_MS = 1500;

function parseRevenue(raw) {
  // e.g. "$4M / month" → 4000, "$400K / month" → 400
  const match = raw.match(/\$([\d.]+)([KM])/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return match[2] === 'M' ? num * 1000 : num;
}

async function scrape() {
  console.log('🚀 Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  console.log('🌐 Navigating to www.paywallscreens.com...');
  await page.goto('https://www.paywallscreens.com/', { waitUntil: 'networkidle' });

  // Scroll repeatedly to trigger infinite-scroll / lazy-load
  console.log(`📜 Scrolling ${SCROLL_ITERATIONS} times to load all items...`);
  for (let i = 0; i < SCROLL_ITERATIONS; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(SCROLL_DELAY_MS);
    console.log(`   Scroll ${i + 1}/${SCROLL_ITERATIONS} done`);
  }

  // Extract app data from rendered DOM
  console.log('🔍 Extracting app data from DOM...');
  const apps = await page.evaluate(() => {
    const seen = new Set();
    const results = [];
    const links = document.querySelectorAll('a[href^="/apps/"]');

    for (const link of links) {
      const fullHref = link.href;
      if (!fullHref.includes('/apps/') || fullHref.includes('/apps/$')) continue;

      const nameEl = link.querySelector('p');
      const name =
        nameEl?.textContent?.trim() ||
        link.textContent?.split('$')[0].trim() ||
        '';

      const revMatch = (link.textContent || '').match(/\$[\d.]+[KM]?\s*\/\s*month/);
      const revenue = revMatch ? revMatch[0] : '';

      if (name && fullHref && !seen.has(name)) {
        seen.add(name);
        results.push({ name, revenue, href: fullHref });
      }
    }
    return results;
  });

  await browser.close();

  if (apps.length === 0) {
    console.error('❌ No apps extracted — check if the site structure changed.');
    process.exit(1);
  }

  // Sort by revenue descending
  apps.sort((a, b) => parseRevenue(b.revenue) - parseRevenue(a.revenue));

  // Add rank
  const ranked = apps.map((app, i) => ({
    rank: i + 1,
    name: app.name,
    revenue: app.revenue,
    revenueRaw: parseRevenue(app.revenue),
    href: app.href,
  }));

  const dataset = {
    meta: {
      source: 'https://www.paywallscreens.com/',
      crawledAt: new Date().toISOString(),
      totalCount: ranked.length,
      description:
        'Pre-scraped top apps from PaywallScreens. Sync reads from this file — no live fetch needed.',
    },
    apps: ranked,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log(`✅ Wrote ${ranked.length} apps to ${OUTPUT_PATH}`);
}

scrape().catch((err) => {
  console.error('❌ Scraper failed:', err);
  process.exit(1);
});
