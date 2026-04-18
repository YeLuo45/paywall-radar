import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PaywallCase, FilterState, SortOption } from '../../types';

interface CasesState {
  items: PaywallCase[];
  filteredItems: PaywallCase[];
  currentCase: PaywallCase | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  filters: FilterState;
  gridDensity: 2 | 3 | 4;
}

const initialState: CasesState = {
  items: [],
  filteredItems: [],
  currentCase: null,
  loading: false,
  syncing: false,
  error: null,
  totalCount: 0,
  page: 1,
  pageSize: 20,
  filters: {
    keyword: '',
    categories: [],
    revenueRanges: [],
    ratingMin: 0,
    ratingMax: 5,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  gridDensity: 3,
};

function applyFilters(items: PaywallCase[], filters: FilterState): PaywallCase[] {
  let result = [...items];

  // Keyword search
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    result = result.filter(
      (c) =>
        c.appName.toLowerCase().includes(kw) ||
        c.developer.toLowerCase().includes(kw) ||
        c.category.toLowerCase().includes(kw)
    );
  }

  // Category filter
  if (filters.categories.length > 0) {
    result = result.filter((c) => filters.categories.includes(c.category));
  }

  // Revenue range filter
  if (filters.revenueRanges.length > 0) {
    result = result.filter((c) => filters.revenueRanges.includes(c.revenueRange));
  }

  // Rating filter
  result = result.filter(
    (c) => c.rating >= filters.ratingMin && c.rating <= filters.ratingMax
  );

  // Sort
  result.sort((a, b) => {
    const field = filters.sortBy;
    const order = filters.sortOrder === 'asc' ? 1 : -1;
    const aVal = a[field];
    const bVal = b[field];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * order;
    }
    return ((aVal as number) - (bVal as number)) * order;
  });

  return result;
}

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setCases(state, action: PayloadAction<PaywallCase[]>) {
      state.items = action.payload;
      state.filteredItems = applyFilters(state.items, state.filters);
      state.totalCount = state.items.length;
    },
    addCases(state, action: PayloadAction<PaywallCase[]>) {
      action.payload.forEach((newCase) => {
        const idx = state.items.findIndex((c) => c.id === newCase.id);
        if (idx >= 0) {
          state.items[idx] = newCase;
        } else {
          state.items.push(newCase);
        }
      });
      state.filteredItems = applyFilters(state.items, state.filters);
      state.totalCount = state.items.length;
    },
    setCurrentCase(state, action: PayloadAction<PaywallCase | null>) {
      state.currentCase = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setFilters(state, action: PayloadAction<Partial<FilterState>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.filteredItems = applyFilters(state.items, state.filters);
      state.page = 1;
    },
    clearFilters(state) {
      state.filters = initialState.filters;
      state.filteredItems = applyFilters(state.items, state.filters);
      state.page = 1;
    },
    setGridDensity(state, action: PayloadAction<2 | 3 | 4>) {
      state.gridDensity = action.payload;
      localStorage.setItem('gridDensity', String(action.payload));
    },
    initGridDensity(state) {
      const saved = localStorage.getItem('gridDensity');
      if (saved && [2, 3, 4].includes(Number(saved))) {
        state.gridDensity = Number(saved) as 2 | 3 | 4;
      }
    },
  },
});

export const {
  setCases,
  addCases,
  setCurrentCase,
  setLoading,
  setSyncing,
  setError,
  setPage,
  setFilters,
  clearFilters,
  setGridDensity,
  initGridDensity,
} = casesSlice.actions;

export default casesSlice.reducer;
