// ============================================================
// Utility Functions for PaywallRadar
// ============================================================

/**
 * Format a timestamp to a readable date string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp to relative time (e.g. "3 days ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(timestamp);
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return '刚刚';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Parse markdown-like text to plain text (basic)
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .trim();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Check if the app is running in PWA standalone mode
 */
export function isPWAStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if the browser supports IndexedDB
 */
export function supportsIndexedDB(): boolean {
  return 'indexedDB' in window && window.indexedDB !== null;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert PaywallCase to Markdown table row
 */
export function caseToMarkdownRow(
  c: {
    appName: string;
    developer: string;
    category: string;
    revenueRange: string;
    rating: number;
    paywallType: string;
    priceRange: string;
  },
  padLength = 15
): string {
  const pad = (s: string) => s.padEnd(padLength);
  return `| ${pad(c.appName)} | ${pad(c.developer)} | ${pad(c.category)} | ${pad(c.revenueRange)} | ${pad(String(c.rating))} | ${pad(c.paywallType)} | ${pad(c.priceRange)} |`;
}

/**
 * Generate Markdown table for comparison report
 */
export function generateMarkdownReport(
  cases: Array<{
    appName: string;
    developer: string;
    category: string;
    revenueRange: string;
    rating: number;
    paywallType: string;
    priceRange: string;
  }>,
  title = '付费墙竞品对比报告'
): string {
  const header = `| 应用名称${' '.repeat(9)} | 开发商${' '.repeat(9)} | 分类${' '.repeat(9)} | 收入区间${' '.repeat(5)} | 评分 | 付费墙类型 | 价格区间 |\n|${'|---'.repeat(7)}|`;
  const rows = cases.map((c) => caseToMarkdownRow(c));

  return `# ${title}

> 生成时间: ${new Date().toLocaleString('zh-CN')}

${header}
${rows.map((r) => r).join('\n')}

---
*由 PaywallRadar 生成*
`;
}
