import type {
  DataSourceProvider,
  RawPaywallCase,
  PaywallCase,
  PaywallType,
  RevenueRange,
} from '../types';

// ============================================================
// PaywallScreens Data Source Provider
// Fetches from paywallscreens.com using CORS-bypassed requests
// ============================================================

function generateId(): string {
  return `pws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function detectPaywallType(text: string): PaywallType {
  const lower = text.toLowerCase();
  if (lower.includes('subscription') || lower.includes('订阅')) return 'subscription';
  if (lower.includes('one-time') || lower.includes('一次性')) return 'one_time';
  if (lower.includes('freemium') || lower.includes('免费增值')) return 'freemium';
  if (lower.includes('paywall') || lower.includes('付费墙')) return 'pay_wall';
  if (lower.includes('trial') || lower.includes('试用')) return 'trial';
  return 'unknown';
}

function detectRevenueRange(text: string): RevenueRange {
  const lower = text.toLowerCase();
  if (lower.includes('$1m') || lower.includes('1m+')) return 'gt_1m';
  if (lower.includes('$100k') || lower.includes('100k')) return '100k_1m';
  if (lower.includes('$10k') || lower.includes('10k')) return '10k_100k';
  if (lower.includes('<')) return 'lt_10k';
  return 'unknown';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class PaywallScreensProvider implements DataSourceProvider {
  id = 'paywall-screens';
  name = 'PaywallScreens.com';
  baseURL = 'https://paywallscreens.com';

  async fetch(url: string): Promise<string> {
    const response = await fetch(url, {
      credentials: 'omit',
      referrer: this.baseURL,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.text();
  }

  async parse(html: string): Promise<RawPaywallCase[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try multiple selectors for card elements
    const cards =
      doc.querySelectorAll('.app-card, .paywall-card, [data-app-id], .listing-item') ||
      doc.querySelectorAll('article, .card');

    const results: RawPaywallCase[] = [];

    cards.forEach((card) => {
      const appName =
        card.querySelector('.app-name, .title, h3, h2')?.textContent?.trim() || '';
      const developer =
        card.querySelector('.developer, .author, .subtitle')?.textContent?.trim() || '';

      const iconEl = card.querySelector('img[src*="icon"], img[src*="logo"]');
      const iconUrl = iconEl?.getAttribute('src') || '';

      const thumbEl = card.querySelector('img[src*="screen"], img[src*="thumb"]');
      const thumbnailUrl = thumbEl?.getAttribute('src') || iconUrl;

      const screenshotEl = card.querySelector('img[src*="screenshot"], a[href*="screenshot"] img');
      const screenshotUrl =
        (screenshotEl?.getAttribute('src') || '') ||
        (screenshotEl?.closest('a')?.getAttribute('href') || '');

      const categoryEl = card.querySelector('.category, .tag, [rel="category"]');
      const category = categoryEl?.textContent?.trim() || '其他';

      const ratingEl = card.querySelector('.rating, .stars, [itemprop="ratingValue"]');
      const ratingText = ratingEl?.textContent || ratingEl?.getAttribute('aria-label') || '';
      const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0') || 0;

      const revenueEl = card.querySelector('.revenue, .income, .earnings');
      const revenueText = revenueEl?.textContent?.trim() || '';
      const revenueRange = detectRevenueRange(revenueText);

      const versionEl = card.querySelector('.version, .ver');
      const version = versionEl?.textContent?.trim() || '1.0';

      const priceEl = card.querySelector('.price, .cost');
      const priceRange = priceEl?.textContent?.trim() || '未知';

      const description =
        card.querySelector('.description, .excerpt, p')?.textContent?.trim() || '';

      const linkEl = card.querySelector('a[href*="/app/"], a[href*="/details/"]');
      const sourceUrl = linkEl
        ? new URL(linkEl.getAttribute('href') || '', this.baseURL).href
        : '';

      if (appName) {
        results.push({
          appName,
          developer,
          iconUrl,
          thumbnailUrl,
          screenshotUrl,
          category,
          tags: [category],
          revenueRange,
          rating,
          version,
          paywallType: detectPaywallType(card.textContent || ''),
          priceRange,
          description,
          sourceUrl,
        });
      }
    });

    // If no cards found, try parse from JSON-LD or microdata
    if (results.length === 0) {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '');
          const items = Array.isArray(data) ? data : [data];
          items.forEach((item: Record<string, unknown>) => {
            if (item['@type'] === 'MobileApplication' || item.name) {
              const author = item.author as Record<string, unknown> | undefined;
              const aggRating = item.aggregateRating as Record<string, unknown> | undefined;
              results.push({
                appName: String(item.name || ''),
                developer: String((author?.name as string) || (item.creator as string) || ''),
                iconUrl: String(item.image || ''),
                thumbnailUrl: String(item.image || ''),
                screenshotUrl: String(item.screenshot || ''),
                category: String(item.applicationCategory || '其他'),
                tags: Array.isArray(item.keywords) ? item.keywords as string[] : [],
                rating: Number((aggRating?.ratingValue as string) || 0),
                version: String(item.version || '1.0'),
                description: String(item.description || ''),
                sourceUrl: String(item.url || ''),
              });
            }
          });
        } catch {
          // ignore parse errors
        }
      });
    }

    return results;
  }

  normalize(raw: RawPaywallCase): PaywallCase {
    const now = Date.now();
    return {
      id: generateId(),
      appName: raw.appName || '未知应用',
      developer: raw.developer || '未知开发商',
      iconUrl: raw.iconUrl || '',
      thumbnailUrl: raw.thumbnailUrl || raw.iconUrl || '',
      screenshotUrl: raw.screenshotUrl || raw.thumbnailUrl || '',
      category: raw.category || '其他',
      tags: raw.tags || [],
      revenueRange: raw.revenueRange || 'unknown',
      rating: raw.rating || 0,
      version: raw.version || '1.0',
      paywallType: raw.paywallType || 'unknown',
      priceRange: raw.priceRange || '未知',
      description: raw.description || '',
      sourceUrl: raw.sourceUrl || '',
      fetchedAt: now,
      updatedAt: now,
    };
  }

  // Get listing page URL for a given page and category
  getListingURL(page = 1, category?: string): string {
    const params = new URLSearchParams({ page: String(page) });
    if (category && category !== '全部') {
      params.set('category', slugify(category));
    }
    return `${this.baseURL}/apps?${params.toString()}`;
  }

  // Get detail page URL for a specific app
  getDetailURL(appSlug: string): string {
    return `${this.baseURL}/app/${appSlug}`;
  }
}

export const paywallScreensProvider = new PaywallScreensProvider();
