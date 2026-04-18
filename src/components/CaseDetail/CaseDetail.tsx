import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaywallCase } from '../../types';
import { REVENUE_RANGE_LABELS, PAYWALL_TYPE_LABELS } from '../../types';
import { formatDate } from '../../utils';
import { useAppDispatch, useAppSelector } from '../../store';
import { addItem } from '../../store/slices/favoritesSlice';
import { addSubscription } from '../../store/slices/subscriptionsSlice';
import { generateId } from '../../utils';

interface CaseDetailProps {
  caseData: PaywallCase;
}

export default function CaseDetail({ caseData }: CaseDetailProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const folders = useAppSelector((s) => s.favorites.folders);
  const activeFolderId = useAppSelector((s) => s.favorites.activeFolderId);
  const subscriptions = useAppSelector((s) => s.subscriptions.subscriptions);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');

  const isSubscribed = subscriptions.some(
    (s) => s.type === 'app' && s.targetId === caseData.id
  );

  const handleFavorite = () => {
    if (!activeFolderId) {
      alert('请先在"我的收藏"中创建收藏夹');
      return;
    }
    const item = {
      id: generateId(),
      folderId: activeFolderId,
      caseId: caseData.id,
      addedAt: Date.now(),
      customTags: [],
      notes: '',
      caseSnapshot: caseData,
    };
    dispatch(addItem(item));
    alert(`已添加到收藏夹`);
  };

  const handleSubscribe = () => {
    if (isSubscribed) return;
    const sub: typeof caseData extends PaywallCase ? Parameters<typeof addSubscription>[0] extends infer T ? T : never : never = {
      id: generateId(),
      type: 'app',
      targetId: caseData.id,
      targetName: caseData.appName,
      baselineSnapshot: caseData,
      createdAt: Date.now(),
      lastCheckAt: null,
    };
    dispatch(addSubscription(sub));
    alert(`已订阅 ${caseData.appName} 的更新监控`);
  };

  return (
    <div className="case-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div className="detail-layout">
        {/* Screenshot Section */}
        <div className="screenshot-section">
          <div
            className="screenshot-main"
            onClick={() => setZoomOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setZoomOpen(true)}
          >
            <img
              src={caseData.screenshotUrl || caseData.thumbnailUrl}
              alt={`${caseData.appName} 截图`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = caseData.iconUrl || '📱';
              }}
            />
            <div className="zoom-hint">点击放大</div>
          </div>

          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleFavorite}>
              ⭐ 收藏
            </button>
            <button
              className={`action-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
              disabled={isSubscribed}
            >
              {isSubscribed ? '🔔 已订阅' : '🔔 订阅更新'}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="app-header-info">
            {caseData.iconUrl && (
              <img src={caseData.iconUrl} alt="" className="app-icon-lg" />
            )}
            <div>
              <h1 className="app-name">{caseData.appName}</h1>
              <p className="app-developer">{caseData.developer}</p>
            </div>
          </div>

          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              应用信息
            </button>
            <button
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              笔记
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="info-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">分类</span>
                  <span className="info-value">{caseData.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">评分</span>
                  <span className="info-value star-val">
                    {'★'.repeat(Math.round(caseData.rating))}
                    {'☆'.repeat(5 - Math.round(caseData.rating))}{' '}
                    {caseData.rating}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">收入估算</span>
                  <span className="info-value revenue-val">
                    {REVENUE_RANGE_LABELS[caseData.revenueRange]}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">付费墙类型</span>
                  <span className="info-value">
                    {PAYWALL_TYPE_LABELS[caseData.paywallType]}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">价格区间</span>
                  <span className="info-value">{caseData.priceRange}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">版本</span>
                  <span className="info-value">{caseData.version}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">标签</span>
                  <div className="tags-list">
                    {caseData.tags.map((t) => (
                      <span key={t} className="tag-badge">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">描述</span>
                  <p className="info-description">
                    {caseData.description || '暂无描述'}
                  </p>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">数据来源</span>
                  <a
                    href={caseData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    {caseData.sourceUrl || '无'}
                  </a>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">抓取时间</span>
                  <span className="info-value muted">
                    {formatDate(caseData.fetchedAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="notes-content">
              <p className="notes-hint">
                在收藏夹中为该案例添加笔记和标签
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomOpen && (
        <div
          className="zoom-modal"
          onClick={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={caseData.screenshotUrl || caseData.thumbnailUrl}
            alt="放大截图"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="zoom-close" onClick={() => setZoomOpen(false)}>
            ✕
          </button>
        </div>
      )}

      <style>{`
        .case-detail {
          max-width: 1100px;
          margin: 0 auto;
        }
        .back-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          margin-bottom: 20px;
          transition: background 0.2s;
        }
        .back-btn:hover { background: #f3f4f6; }
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        .screenshot-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .screenshot-main {
          background: #f3f4f6;
          border-radius: 12px;
          overflow: hidden;
          cursor: zoom-in;
          position: relative;
          aspect-ratio: 9/16;
        }
        .screenshot-main img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .zoom-hint {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          flex: 1;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .action-btn.primary {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }
        .action-btn.primary:hover { background: #4338ca; }
        .action-btn.subscribed {
          background: #f3f4f6;
          color: #6b7280;
          cursor: default;
        }
        .info-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .app-header-info {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .app-icon-lg {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          object-fit: cover;
        }
        .app-name {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #111827;
        }
        .app-developer {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        .tab-bar {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 20px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
          font-weight: 600;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .info-item { display: flex; flex-direction: column; gap: 4px; }
        .info-item.full-width { grid-column: 1 / -1; }
        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value { font-size: 14px; color: #374151; }
        .info-value.muted { color: #9ca3af; }
        .star-val { color: #f59e0b; }
        .revenue-val { color: #166534; font-weight: 500; }
        .tags-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .tag-badge {
          background: #e0e7ff;
          color: #4338ca;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .info-description { font-size: 14px; color: #374151; margin: 0; line-height: 1.6; }
        .source-link { color: #4f46e5; font-size: 13px; word-break: break-all; }
        .notes-hint { color: #9ca3af; font-size: 14px; text-align: center; padding: 32px; }
        .zoom-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          cursor: zoom-out;
        }
        .zoom-modal img {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          cursor: default;
        }
        .zoom-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          color: white;
          font-size: 20px;
        }
        @media (max-width: 768px) {
          .detail-layout { grid-template-columns: 1fr; }
          .info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
