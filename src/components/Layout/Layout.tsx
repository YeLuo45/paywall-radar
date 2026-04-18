import React from 'react';
import Header from './Header';
import { useAppSelector } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pendingChanges = useAppSelector((s) => s.subscriptions.pendingChanges);
  const totalCount = useAppSelector((s) => s.cases.totalCount);

  return (
    <div className="app-layout">
      <Header pendingChanges={pendingChanges} />
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <span>PaywallRadar v1.0.0</span>
        <span>付费墙竞品调研工具</span>
      </footer>

      <style>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .app-header {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 24px;
          height: 60px;
          background: #4f46e5;
          color: white;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .header-brand {
          flex-shrink: 0;
        }
        .brand-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: white;
        }
        .brand-icon {
          font-size: 24px;
        }
        .brand-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header-nav {
          display: flex;
          gap: 4px;
          flex: 1;
          overflow-x: auto;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          text-decoration: none;
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.15);
          color: white;
        }
        .nav-item.active {
          background: rgba(255,255,255,0.2);
          color: white;
          font-weight: 600;
        }
        .nav-icon {
          font-size: 16px;
        }
        .nav-badge {
          background: #ef4444;
          color: white;
          border-radius: 10px;
          padding: 0 6px;
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .case-count {
          font-size: 13px;
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.15);
          padding: 4px 10px;
          border-radius: 12px;
        }
        .app-main {
          flex: 1;
          padding: 24px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .app-footer {
          display: flex;
          justify-content: space-between;
          padding: 12px 24px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          font-size: 13px;
          color: #6b7280;
        }
        @media (max-width: 768px) {
          .app-header {
            flex-wrap: wrap;
            height: auto;
            padding: 12px 16px;
            gap: 12px;
          }
          .header-nav {
            order: 3;
            width: 100%;
          }
          .nav-label {
            display: none;
          }
          .app-main {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
