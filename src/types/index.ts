// ============================================================
// PaywallRadar Type Definitions
// ============================================================

export interface PaywallCase {
  id: string;
  appName: string;
  developer: string;
  iconUrl: string;
  thumbnailUrl: string;
  screenshotUrl: string;
  category: string;
  tags: string[];
  revenueRange: RevenueRange;
  rating: number;
  version: string;
  paywallType: PaywallType;
  priceRange: string;
  description: string;
  sourceUrl: string;
  fetchedAt: number;
  updatedAt: number;
}

export type PaywallType =
  | 'subscription'
  | 'one_time'
  | 'freemium'
  | 'pay_wall'
  | 'trial'
  | 'unknown';

export type RevenueRange =
  | 'unknown'
  | 'lt_10k'
  | '10k_100k'
  | '100k_1m'
  | 'gt_1m';

export const REVENUE_RANGE_LABELS: Record<RevenueRange, string> = {
  unknown: '未知',
  lt_10k: '< $10k',
  '10k_100k': '$10k - $100k',
  '100k_1m': '$100k - $1M',
  gt_1m: '> $1M',
};

export const PAYWALL_TYPE_LABELS: Record<PaywallType, string> = {
  subscription: '订阅制',
  one_time: '一次性购买',
  freemium: '免费增值',
  pay_wall: '付费墙',
  trial: '试用',
  unknown: '未知',
};

export const CATEGORIES = [
  '社交',
  '健身',
  '工具',
  '游戏',
  '娱乐',
  '新闻',
  '音乐',
  '视频',
  '教育',
  '商务',
  '金融',
  '旅游',
  '美食',
  '摄影',
  '图书',
  '医疗',
  '生活方式',
  '体育',
  '儿童',
  '其他',
] as const;

export type Category = (typeof CATEGORIES)[number];

// ============================================================
// Favorites
// ============================================================

export interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FavoriteItem {
  id: string;
  folderId: string;
  caseId: string;
  addedAt: number;
  customTags: string[];
  notes: string;
  caseSnapshot: PaywallCase;
}

// ============================================================
// Subscriptions / Monitoring
// ============================================================

export interface Subscription {
  id: string;
  type: 'app' | 'category';
  targetId: string;
  targetName: string;
  baselineSnapshot: PaywallCase | null;
  createdAt: number;
  lastCheckAt: number | null;
}

export interface ChangeRecord {
  id: string;
  subscriptionId: string;
  caseId: string;
  detectedAt: number;
  changes: ChangeDetail[];
  status: 'new' | 'changed' | 'unchanged';
}

export interface ChangeDetail {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

// ============================================================
// Filter State
// ============================================================

export interface FilterState {
  keyword: string;
  categories: string[];
  revenueRanges: RevenueRange[];
  ratingMin: number;
  ratingMax: number;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

export type SortOption =
  | 'appName'
  | 'rating'
  | 'fetchedAt'
  | 'updatedAt';

// ============================================================
// Data Source Provider Interface
// ============================================================

export interface DataSourceProvider {
  id: string;
  name: string;
  baseURL: string;
  fetch(url: string): Promise<string>;
  parse(html: string): Promise<RawPaywallCase[]>;
  normalize(raw: RawPaywallCase): PaywallCase;
}

export interface RawPaywallCase {
  appName?: string;
  developer?: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  screenshotUrl?: string;
  category?: string;
  tags?: string[];
  revenueRange?: RevenueRange;
  rating?: number;
  version?: string;
  paywallType?: PaywallType;
  priceRange?: string;
  description?: string;
  sourceUrl?: string;
}

// ============================================================
// UI State
// ============================================================

export interface GridDensity {
  columns: 2 | 3 | 4;
  label: string;
}

export const GRID_DENSITIES: GridDensity[] = [
  { columns: 2, label: '2列' },
  { columns: 3, label: '3列' },
  { columns: 4, label: '4列' },
];

// ============================================================
// Compare Report
// ============================================================

export interface CompareReport {
  cases: PaywallCase[];
  generatedAt: number;
}

export interface TrendData {
  category: string;
  count: number;
  percentage: number;
}

export interface RevenueDistribution {
  range: string;
  count: number;
  percentage: number;
}
