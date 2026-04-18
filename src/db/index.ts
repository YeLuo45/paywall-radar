import Dexie, { Table } from 'dexie';
import type {
  PaywallCase,
  FavoriteFolder,
  FavoriteItem,
  Subscription,
  ChangeRecord,
} from '../types';

export class PaywallRadarDB extends Dexie {
  cases!: Table<PaywallCase, string>;
  favoriteFolders!: Table<FavoriteFolder, string>;
  favoriteItems!: Table<FavoriteItem, string>;
  subscriptions!: Table<Subscription, string>;
  changeRecords!: Table<ChangeRecord, string>;

  constructor() {
    super('paywall-radar-db');

    this.version(1).stores({
      cases: 'id, appName, developer, category, rating, revenueRange, fetchedAt, updatedAt',
      favoriteFolders: 'id, name, createdAt',
      favoriteItems: 'id, folderId, caseId, addedAt',
      subscriptions: 'id, type, targetId, createdAt',
      changeRecords: 'id, subscriptionId, caseId, detectedAt',
    });
  }

  // Cases
  async upsertCase(caseData: PaywallCase): Promise<void> {
    await this.cases.put(caseData);
  }

  async upsertCases(casesData: PaywallCase[]): Promise<void> {
    await this.cases.bulkPut(casesData);
  }

  async getCaseById(id: string): Promise<PaywallCase | undefined> {
    return this.cases.get(id);
  }

  async getAllCases(): Promise<PaywallCase[]> {
    return this.cases.toArray();
  }

  async getCasesByCategory(category: string): Promise<PaywallCase[]> {
    return this.cases.where('category').equals(category).toArray();
  }

  async searchCases(keyword: string): Promise<PaywallCase[]> {
    const lower = keyword.toLowerCase();
    return this.cases
      .filter(
        (c) =>
          c.appName.toLowerCase().includes(lower) ||
          c.developer.toLowerCase().includes(lower) ||
          c.category.toLowerCase().includes(lower)
      )
      .toArray();
  }

  async getCaseCount(): Promise<number> {
    return this.cases.count();
  }

  // Favorite Folders
  async createFolder(folder: FavoriteFolder): Promise<string> {
    await this.favoriteFolders.add(folder);
    return folder.id;
  }

  async getAllFolders(): Promise<FavoriteFolder[]> {
    return this.favoriteFolders.orderBy('createdAt').toArray();
  }

  async updateFolder(id: string, updates: Partial<FavoriteFolder>): Promise<void> {
    await this.favoriteFolders.update(id, { ...updates, updatedAt: Date.now() });
  }

  async deleteFolder(id: string): Promise<void> {
    await this.transaction('rw', this.favoriteFolders, this.favoriteItems, async () => {
      await this.favoriteItems.where('folderId').equals(id).delete();
      await this.favoriteFolders.delete(id);
    });
  }

  // Favorite Items
  async addToFavorites(item: FavoriteItem): Promise<void> {
    const existing = await this.favoriteItems
      .where({ folderId: item.folderId, caseId: item.caseId })
      .first();
    if (!existing) {
      await this.favoriteItems.add(item);
    }
  }

  async removeFromFavorites(folderId: string, caseId: string): Promise<void> {
    await this.favoriteItems
      .where({ folderId, caseId })
      .delete();
  }

  async getFavoriteItems(folderId: string): Promise<FavoriteItem[]> {
    return this.favoriteItems.where('folderId').equals(folderId).toArray();
  }

  async getAllFavoriteItems(): Promise<FavoriteItem[]> {
    return this.favoriteItems.toArray();
  }

  async isFavorite(folderId: string, caseId: string): Promise<boolean> {
    const item = await this.favoriteItems
      .where({ folderId, caseId })
      .first();
    return !!item;
  }

  async updateFavoriteItem(
    itemId: string,
    updates: Partial<FavoriteItem>
  ): Promise<void> {
    await this.favoriteItems.update(itemId, updates);
  }

  // Subscriptions
  async createSubscription(sub: Subscription): Promise<string> {
    await this.subscriptions.add(sub);
    return sub.id;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptions.toArray();
  }

  async getSubscriptionsByType(type: 'app' | 'category'): Promise<Subscription[]> {
    return this.subscriptions.where('type').equals(type).toArray();
  }

  async updateSubscription(
    id: string,
    updates: Partial<Subscription>
  ): Promise<void> {
    await this.subscriptions.update(id, updates);
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.transaction('rw', this.subscriptions, this.changeRecords, async () => {
      await this.changeRecords.where('subscriptionId').equals(id).delete();
      await this.subscriptions.delete(id);
    });
  }

  // Change Records
  async addChangeRecord(record: ChangeRecord): Promise<void> {
    await this.changeRecords.add(record);
  }

  async getChangeRecords(subscriptionId?: string): Promise<ChangeRecord[]> {
    if (subscriptionId) {
      return this.changeRecords
        .where('subscriptionId')
        .equals(subscriptionId)
        .reverse()
        .sortBy('detectedAt');
    }
    return this.changeRecords.reverse().sortBy('detectedAt');
  }

  // Stats
  async getCategoryStats(): Promise<Record<string, number>> {
    const cases = await this.cases.toArray();
    const stats: Record<string, number> = {};
    for (const c of cases) {
      stats[c.category] = (stats[c.category] || 0) + 1;
    }
    return stats;
  }

  async getRevenueStats(): Promise<Record<string, number>> {
    const cases = await this.cases.toArray();
    const stats: Record<string, number> = {};
    for (const c of cases) {
      stats[c.revenueRange] = (stats[c.revenueRange] || 0) + 1;
    }
    return stats;
  }
}

export const db = new PaywallRadarDB();
