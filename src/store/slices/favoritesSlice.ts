import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FavoriteFolder, FavoriteItem } from '../../types';

interface FavoritesState {
  folders: FavoriteFolder[];
  items: FavoriteItem[];
  activeFolderId: string | null;
  selectedCaseIds: string[];
  loading: boolean;
}

const initialState: FavoritesState = {
  folders: [],
  items: [],
  activeFolderId: null,
  selectedCaseIds: [],
  loading: false,
};

function generateId(): string {
  return `fav_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFolders(state, action: PayloadAction<FavoriteFolder[]>) {
      state.folders = action.payload;
      if (action.payload.length > 0 && !state.activeFolderId) {
        state.activeFolderId = action.payload[0].id;
      }
    },
    addFolder(state, action: PayloadAction<{ name: string; description?: string }>) {
      const now = Date.now();
      const folder: FavoriteFolder = {
        id: generateId(),
        name: action.payload.name,
        description: action.payload.description,
        createdAt: now,
        updatedAt: now,
      };
      state.folders.push(folder);
      state.activeFolderId = folder.id;
    },
    updateFolder(
      state,
      action: PayloadAction<{ id: string; name?: string; description?: string }>
    ) {
      const folder = state.folders.find((f) => f.id === action.payload.id);
      if (folder) {
        if (action.payload.name) folder.name = action.payload.name;
        if (action.payload.description !== undefined)
          folder.description = action.payload.description;
        folder.updatedAt = Date.now();
      }
    },
    removeFolder(state, action: PayloadAction<string>) {
      state.folders = state.folders.filter((f) => f.id !== action.payload);
      state.items = state.items.filter((i) => i.folderId !== action.payload);
      if (state.activeFolderId === action.payload) {
        state.activeFolderId = state.folders[0]?.id || null;
      }
    },
    setActiveFolder(state, action: PayloadAction<string | null>) {
      state.activeFolderId = action.payload;
      state.selectedCaseIds = [];
    },
    setItems(state, action: PayloadAction<FavoriteItem[]>) {
      state.items = action.payload;
    },
    addItem(state, action: PayloadAction<FavoriteItem>) {
      const exists = state.items.find(
        (i) => i.folderId === action.payload.folderId && i.caseId === action.payload.caseId
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<{ folderId: string; caseId: string }>) {
      state.items = state.items.filter(
        (i) => !(i.folderId === action.payload.folderId && i.caseId === action.payload.caseId)
      );
      state.selectedCaseIds = state.selectedCaseIds.filter(
        (id) => id !== action.payload.caseId
      );
    },
    updateItem(
      state,
      action: PayloadAction<{
        id: string;
        customTags?: string[];
        notes?: string;
      }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        if (action.payload.customTags) item.customTags = action.payload.customTags;
        if (action.payload.notes !== undefined) item.notes = action.payload.notes;
      }
    },
    toggleSelectCase(state, action: PayloadAction<string>) {
      const idx = state.selectedCaseIds.indexOf(action.payload);
      if (idx >= 0) {
        state.selectedCaseIds.splice(idx, 1);
      } else {
        state.selectedCaseIds.push(action.payload);
      }
    },
    clearSelection(state) {
      state.selectedCaseIds = [];
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const {
  setFolders,
  addFolder,
  updateFolder,
  removeFolder,
  setActiveFolder,
  setItems,
  addItem,
  removeItem,
  updateItem,
  toggleSelectCase,
  clearSelection,
  setLoading,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
