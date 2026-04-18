import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '案例浏览', icon: '📱' },
  { path: '/favorites', label: '我的收藏', icon: '⭐' },
  { path: '/compare', label: '对比报告', icon: '📊' },
  { path: '/trends', label: '趋势分析', icon: '📈' },
  { path: '/subscriptions', label: '监控订阅', icon: '🔔' },
  { path: '/sync', label: '数据同步', icon: '🔄' },
];

interface HeaderProps {
  pendingChanges?: number;
}

export default function Header({ pendingChanges = 0 }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">🎯</span>
          <span className="brand-name">PaywallRadar</span>
        </Link>
      </div>

      <nav className="header-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.path === '/subscriptions' && pendingChanges > 0 && (
              <span className="nav-badge">{pendingChanges}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <div className="case-count" id="case-count-display">
          加载中...
        </div>
      </div>
    </header>
  );
}
