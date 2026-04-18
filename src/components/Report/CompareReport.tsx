import React, { useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { clearSelection } from '../../store/slices/favoritesSlice';
import { REVENUE_RANGE_LABELS, PAYWALL_TYPE_LABELS, type PaywallCase } from '../../types';
import { generateMarkdownReport, copyToClipboard } from '../../utils';

type ViewMode = 'table' | 'cards';

export default function CompareReport() {
  const dispatch = useAppDispatch();
  const { items, selectedCaseIds } = useAppSelector((s) => s.favorites);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [copied, setCopied] = useState(false);

  const selectedItems = useMemo(() => {
    return selectedCaseIds
      .map((id) => items.find((i) => i.caseId === id)?.caseSnapshot)
      .filter(Boolean) as PaywallCase[];
  }, [selectedCaseIds, items]);

  const handleCopyMarkdown = async () => {
    const md = generateMarkdownReport(selectedItems);
    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (selectedCaseIds.length === 0) {
    return (
      <div className="compare-empty">
        <div className="empty-icon">📊</div>
        <h3>生成竞品对比报告</h3>
        <p>请在"我的收藏"中选择 2-10 个案例后，再来这里生成对比报告。</p>
        <style>{`
          .compare-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 80px 24px;
            text-align: center;
          }
          .empty-icon { font-size: 64px; margin-bottom: 16px; }
          .compare-empty h3 { font-size: 20px; color: #111827; margin: 0 0 8px; }
          .compare-empty p { color: #6b7280; font-size: 14px; margin: 0; max-width: 400px; }
        `}</style>
      </div>
    );
  }

  const md = generateMarkdownReport(selectedItems);

  return (
    <div className="compare-report">
      <div className="report-header">
        <div>
          <h2>竞品对比报告</h2>
          <p>已选择 {selectedCaseIds.length} 个案例</p>
        </div>
        <div className="report-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              表格
            </button>
            <button
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
            >
              卡片
            </button>
          </div>
          <button className="copy-btn" onClick={handleCopyMarkdown}>
            {copied ? '✓ 已复制' : '📋 复制 Markdown'}
          </button>
          <button
            className="clear-btn"
            onClick={() => dispatch(clearSelection())}
          >
            清除选择
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th>应用名称</th>
                <th>开发商</th>
                <th>分类</th>
                <th>收入区间</th>
                <th>评分</th>
                <th>付费墙类型</th>
                <th>价格区间</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="app-cell">
                      {c.iconUrl && (
                        <img src={c.iconUrl} alt="" className="app-icon-sm" />
                      )}
                      <span>{c.appName}</span>
                    </div>
                  </td>
                  <td>{c.developer}</td>
                  <td>
                    <span className="cat-badge">{c.category}</span>
                  </td>
                  <td className="revenue-cell">
                    {REVENUE_RANGE_LABELS[c.revenueRange]}
                  </td>
                  <td className="rating-cell">
                    {'★'.repeat(Math.round(c.rating))}
                    {'☆'.repeat(5 - Math.round(c.rating))}{' '}
                    {c.rating.toFixed(1)}
                  </td>
                  <td>{PAYWALL_TYPE_LABELS[c.paywallType]}</td>
                  <td>{c.priceRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="compare-cards">
          {selectedItems.map((c) => (
            <div key={c.id} className="compare-card">
              <div className="compare-card-header">
                {c.iconUrl && (
                  <img src={c.iconUrl} alt="" className="card-icon" />
                )}
                <div>
                  <h4>{c.appName}</h4>
                  <p>{c.developer}</p>
                </div>
              </div>
              <div className="compare-card-body">
                <div className="card-row">
                  <span className="row-label">分类</span>
                  <span className="cat-badge">{c.category}</span>
                </div>
                <div className="card-row">
                  <span className="row-label">收入区间</span>
                  <span className="revenue-val">
                    {REVENUE_RANGE_LABELS[c.revenueRange]}
                  </span>
                </div>
                <div className="card-row">
                  <span className="row-label">评分</span>
                  <span className="star-val">
                    {'★'.repeat(Math.round(c.rating))}
                    {'☆'.repeat(5 - Math.round(c.rating))} {c.rating.toFixed(1)}
                  </span>
                </div>
                <div className="card-row">
                  <span className="row-label">付费墙类型</span>
                  <span>{PAYWALL_TYPE_LABELS[c.paywallType]}</span>
                </div>
                <div className="card-row">
                  <span className="row-label">价格区间</span>
                  <span>{c.priceRange}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="markdown-preview">
        <h4>Markdown 预览</h4>
        <pre>{md}</pre>
      </div>

      <style>{`
        .compare-report { max-width: 1200px; margin: 0 auto; }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .report-header h2 { font-size: 22px; margin: 0 0 4px; color: #111827; }
        .report-header p { color: #6b7280; font-size: 14px; margin: 0; }
        .report-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .view-toggle {
          display: flex;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }
        .view-toggle button {
          padding: 6px 14px;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
        }
        .view-toggle button.active { background: #4f46e5; color: white; }
        .copy-btn {
          padding: 6px 14px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }
        .copy-btn:hover { background: #047857; }
        .clear-btn {
          padding: 6px 14px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #6b7280;
        }
        .compare-table-wrapper { overflow-x: auto; margin-bottom: 24px; }
        .compare-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .compare-table th {
          background: #f3f4f6;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }
        .compare-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
        }
        .compare-table tr:last-child td { border-bottom: none; }
        .app-cell { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .app-icon-sm { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; }
        .cat-badge { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .revenue-cell { color: #166534; font-weight: 500; }
        .rating-cell { color: #f59e0b; }
        .compare-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .compare-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .compare-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .compare-card-header .card-icon { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
        .compare-card-header h4 { margin: 0 0 2px; font-size: 15px; color: #111827; }
        .compare-card-header p { margin: 0; font-size: 12px; color: #6b7280; }
        .compare-card-body { padding: 12px 16px; }
        .card-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .card-row:last-child { border-bottom: none; }
        .row-label { color: #9ca3af; }
        .revenue-val { color: #166534; font-weight: 500; }
        .star-val { color: #f59e0b; }
        .markdown-preview { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .markdown-preview h4 { font-size: 14px; color: #374151; margin: 0 0 12px; }
        .markdown-preview pre {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          font-size: 12px;
          overflow-x: auto;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
