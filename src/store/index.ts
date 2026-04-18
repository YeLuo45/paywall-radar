import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import casesReducer from './slices/casesSlice';
import favoritesReducer from './slices/favoritesSlice';
import subscriptionsReducer from './slices/subscriptionsSlice';

export const store = configureStore({
  reducer: {
    cases: casesReducer,
    favorites: favoritesReducer,
    subscriptions: subscriptionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
