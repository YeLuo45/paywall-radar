import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
          console.log('SW registered:', r);
        },
        onRegisterError(err: Error) {
          console.error('SW registration error:', err);
        },
      });
    }).catch(() => {
      // PWA plugin not available in dev mode, ignore
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
