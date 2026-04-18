import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import CaseDetailPage from './pages/CaseDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import ComparePage from './pages/ComparePage';
import TrendsPage from './pages/TrendsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SyncPage from './pages/SyncPage';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/case/:id" element={<CaseDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/sync" element={<SyncPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}
