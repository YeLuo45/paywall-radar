import type {
  DataSourceProvider,
  RawPaywallCase,
  PaywallCase,
  PaywallType,
  RevenueRange,
} from '../types';

// ============================================================
// PaywallScreens Data Source Provider
//
// Architecture: Data is pre-scraped via Playwright and bundled as
// static JSON in /data/top-apps.json. The sync button reads this
// file directly — no live network request, no CORS issues.
//
// To refresh data: run scripts/scrape-paywall-screens.mjs
// or trigger the GitHub Actions "Scrape PaywallScreens" workflow.
// ============================================================

function generateId(): string {
  return `pws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function detectPaywallType(_text: string): PaywallType {
  // Pre-scraped data uses revenue-based heuristics since we don't
  // have the full paywall page HTML at parse time.
  return 'subscription';
}

function detectRevenueRange(text: string): RevenueRange {
  const lower = text.toLowerCase();
  if (lower.includes('$1m') || lower.includes('4m') || lower.includes('1m+')) return 'gt_1m';
  if (lower.includes('$100k') || lower.includes('900k') || lower.includes('800k')) return '100k_1m';
  if (lower.includes('$10k') || lower.includes('10k')) return '10k_100k';
  if (lower.includes('<')) return 'lt_10k';
  return 'unknown';
}

// Revenue string like "$4M / month" or "$400K / month" → RevenueRange
function revenueToRange(revenueText: string): RevenueRange {
  const text = revenueText.toLowerCase();
  if (text.includes('4m') || text.includes('2m') || text.includes('1m')) return 'gt_1m';
  if (text.includes('900k') || text.includes('800k')) return '100k_1m';
  if (text.includes('400k')) return '100k_1m';
  return 'unknown';
}

// Map app name keywords to category
function inferCategory(appName: string): string {
  const name = appName.toLowerCase();
  if (name.includes('fitness') || name.includes('workout') || name.includes('gym') || name.includes('yoga') || name.includes('calorie') || name.includes('diet') || name.includes('weight') || name.includes('health')) return '健身';
  if (name.includes('meditation') || name.includes('sleep') || name.includes('prayer') || name.includes('calm') || name.includes('hallow')) return '健康';
  if (name.includes('photo') || name.includes('camera') || name.includes('video') || name.includes('editor') || name.includes('makeup') || name.includes('art') || name.includes('filter') || name.includes('collage')) return '摄影';
  if (name.includes('dating') || name.includes('chat') || name.includes('social') || name.includes('friend')) return '社交';
  if (name.includes('novel') || name.includes('book') || name.includes('story') || name.includes('comic') || name.includes('manga') || name.includes('read')) return '图书';
  if (name.includes('language') || name.includes('learn') || name.includes('course') || name.includes('education') || name.includes('guitar') || name.includes('yousician')) return '教育';
  if (name.includes('trading') || name.includes('finance') || name.includes('stock') || name.includes('invest') || name.includes('bank') || name.includes('bloomberg') || name.includes('economist')) return '金融';
  if (name.includes('weather') || name.includes('wind') || name.includes('radar') || name.includes('navigation') || name.includes('gps') || name.includes('map')) return '工具';
  if (name.includes('vpn') || name.includes('security') || name.includes('antivirus') || name.includes('privacy')) return '工具';
  if (name.includes('ai') || name.includes('chat') || name.includes('assistant') || name.includes('bot')) return '工具';
  if (name.includes('music') || name.includes('stream') || name.includes('tv') || name.includes('video') || name.includes('movie') || name.includes('entertainment')) return '娱乐';
  if (name.includes('game') || name.includes('golf') || name.includes('sport')) return '游戏';
  if (name.includes('drive') || name.includes('cloud') || name.includes('storage')) return '工具';
  if (name.includes('news') || name.includes('magazine') || name.includes('newspaper')) return '新闻';
  return '其他';
}

// Bundled JSON app type (raw from crawler)
interface BundledApp {
  rank: number;
  name: string;
  revenue: string;
  href: string;
}

interface BundledDataset {
  meta: { source: string; crawledAt: string; totalCount: number };
  apps: BundledApp[];
}

// Singleton cache — loaded once per page session
let cachedApps: BundledApp[] | null = null;

async function loadBundledApps(): Promise<BundledApp[]> {
  if (cachedApps) return cachedApps;
  try {
    const res = await fetch('/data/top-apps.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: BundledDataset = await res.json();
    cachedApps = data.apps;
    return cachedApps;
  } catch (err) {
    console.error('[PaywallScreensProvider] Failed to load bundled data:', err);
    return [];
  }
}

export class PaywallScreensProvider implements DataSourceProvider {
  id = 'paywall-screens';
  name = 'PaywallScreens.com';
  baseURL = 'https://www.paywallscreens.com';

  // No-op: data comes from bundled JSON, not live fetch
  async fetch(_url: string): Promise<string> {
    return '';
  }

  async parse(_html: string): Promise<RawPaywallCase[]> {
    // Called by SyncPanel but we override handleSync to use loadFromBundled directly
    return [];
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

  /**
   * Load all bundled apps, optionally limited by page count.
   * Each "page" = ~20 apps (scrolling 5× in the crawler).
   */
  async loadFromBundled(pageCount: number = 5): Promise<PaywallCase[]> {
    const allApps = await loadBundledApps();
    const limit = pageCount * 20;
    const selected = allApps.slice(0, limit);

    return selected.map((app) => {
      const raw: RawPaywallCase = {
        appName: app.name,
        developer: '',
        iconUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=4f46e5&color=fff&size=128`,
        thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(app.name)}/300/500`,
        screenshotUrl: '',
        category: inferCategory(app.name),
        tags: [inferCategory(app.name)],
        revenueRange: revenueToRange(app.revenue),
        rating: 0,
        version: '1.0',
        paywallType: detectPaywallType(app.revenue),
        priceRange: app.revenue,
        description: `${app.name} 是 PaywallScreens 收录的高收入应用，月收入 ${app.revenue}。`,
        sourceUrl: app.href,
      };
      return this.normalize(raw);
    });
  }

  // Keep for compatibility — returns bundled data count
  async getTotalCount(): Promise<number> {
    const apps = await loadBundledApps();
    return apps.length;
  }

  getListingURL(page = 1): string {
    return `${this.baseURL}/apps?page=${page}`;
  }

  getDetailURL(_appSlug: string): string {
    return this.baseURL;
  }
}

export const paywallScreensProvider = new PaywallScreensProvider();
