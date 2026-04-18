import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Subscription, ChangeRecord } from '../../types';

interface SubscriptionsState {
  subscriptions: Subscription[];
  changeRecords: ChangeRecord[];
  pendingChanges: number;
  checking: boolean;
  loading: boolean;
}

const initialState: SubscriptionsState = {
  subscriptions: [],
  changeRecords: [],
  pendingChanges: 0,
  checking: false,
  loading: false,
};

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    setSubscriptions(state, action: PayloadAction<Subscription[]>) {
      state.subscriptions = action.payload;
    },
    addSubscription(state, action: PayloadAction<Subscription>) {
      state.subscriptions.push(action.payload);
    },
    updateSubscription(
      state,
      action: PayloadAction<{ id: string; updates: Partial<Subscription> }>
    ) {
      const sub = state.subscriptions.find((s) => s.id === action.payload.id);
      if (sub) {
        Object.assign(sub, action.payload.updates);
      }
    },
    removeSubscription(state, action: PayloadAction<string>) {
      state.subscriptions = state.subscriptions.filter((s) => s.id !== action.payload);
    },
    setChangeRecords(state, action: PayloadAction<ChangeRecord[]>) {
      state.changeRecords = action.payload;
      state.pendingChanges = action.payload.filter((r) => r.status !== 'unchanged').length;
    },
    addChangeRecord(state, action: PayloadAction<ChangeRecord>) {
      state.changeRecords.unshift(action.payload);
      if (action.payload.status !== 'unchanged') {
        state.pendingChanges += 1;
      }
    },
    clearPendingChanges(state) {
      state.pendingChanges = 0;
    },
    setChecking(state, action: PayloadAction<boolean>) {
      state.checking = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const {
  setSubscriptions,
  addSubscription,
  updateSubscription,
  removeSubscription,
  setChangeRecords,
  addChangeRecord,
  clearPendingChanges,
  setChecking,
  setLoading,
} = subscriptionsSlice.actions;

export default subscriptionsSlice.reducer;
