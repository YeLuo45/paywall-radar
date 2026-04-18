import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  removeSubscription,
  addChangeRecord,
  setChecking,
} from '../../store/slices/subscriptionsSlice';
import { paywallScreensProvider } from '../../providers/PaywallScreensProvider';
import { db } from '../../db';
import { formatRelativeTime, generateId } from '../../utils';
import type { ChangeDetail } from '../../types';

export default function SubscriptionsView() {
  const dispatch = useAppDispatch();
  const { subscriptions, changeRecords, pendingChanges, checking } = useAppSelector(
    (s) => s.subscriptions
  );
  const cases = useAppSelector((s) => s.cases.items);
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');

  const handleCheckUpdate = async (subId: string) => {
    dispatch(setChecking(true));
    const sub = subscriptions.find((s) => s.id === subId);
    if (!sub) return;

    try {
      const url = paywallScreensProvider.getDetailURL(sub.targetName.toLowerCase().replace(/\s+/g, '-'));
      const html = await paywallScreensProvider.fetch(url);
      const rawCases = await paywallScreensProvider.parse(html);

      if (rawCases.length > 0) {
        const newCase = paywallScreensProvider.normalize(rawCases[0]);
        const baseline = sub.baselineSnapshot;

        const changes: ChangeDetail[] = [];
        if (baseline) {
          if (baseline.priceRange !== newCase.priceRange) {
            changes.push({
              field: 'priceRange',
              oldValue: baseline.priceRange,
              newValue: newCase.priceRange,
            });
          }
          if (baseline.version !== newCase.version) {
            changes.push({
              field: 'version',
              oldValue: baseline.version,
              newValue: newCase.version,
            });
          }
          if (baseline.screenshotUrl !== newCase.screenshotUrl) {
            changes.push({
              field: 'screenshotUrl',
              oldValue: baseline.screenshotUrl,
              newValue: newCase.screenshotUrl,
            });
          }
          if (Math.abs(baseline.rating - newCase.rating) > 0.1) {
            changes.push({
              field: 'rating',
              oldValue: baseline.rating,
              newValue: newCase.rating,
            });
          }
        }

        const record = {
          id: generateId(),
          subscriptionId: subId,
          caseId: newCase.id,
          detectedAt: Date.now(),
          changes,
          status: changes.length > 0 ? ('changed' as const) : ('unchanged' as const),
        };

        dispatch(addChangeRecord(record));
        await db.addChangeRecord(record);

        if (changes.length === 0) {
          alert('未检测到变更');
        } else {
          alert(`检测到 ${changes.length} 处变更！`);
        }
      }
    } catch (err) {
      alert(`检查失败: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      dispatch(setChecking(false));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要取消订阅吗？')) {
      dispatch(removeSubscription(id));
    }
  };

  const groupedChanges = useMemo(() => {
    const grouped: Record<string, typeof changeRecords> = {};
    changeRecords.forEach((r) => {
      if (!grouped[r.subscriptionId]) grouped[r.subscriptionId] = [];
      grouped[r.subscriptionId].push(r);
    });
    return grouped;
  }, [changeRecords]);

  return (
    <div className="subscriptions-view">
      <div className="subs-header">
        <h2>监控订阅</h2>
        <p>订阅应用或分类的数据变更监控</p>
      </div>

      {pendingChanges > 0 && (
        <div className="pending-banner">
          🔔 检测到 {pendingChanges} 个案例发生变更，请查看变更详情
        </div>
      )}

      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          订阅列表 ({subscriptions.length})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          变更历史
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="subs-list">
          {subscriptions.length === 0 ? (
            <div className="empty-subs">
              <p>暂无订阅</p>
              <p className="hint">在案例详情页点击「订阅更新」即可监控该应用的变更</p>
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="sub-card">
                <div className="sub-info">
                  <div className="sub-type-badge">{sub.type === 'app' ? '📱' : '📁'} {sub.type === 'app' ? '应用' : '分类'}</div>
                  <h4>{sub.targetName}</h4>
                  <p className="sub-meta">
                    订阅时间: {formatRelativeTime(sub.createdAt)}
                    {sub.lastCheckAt && (
                      <> · 上次检查: {formatRelativeTime(sub.lastCheckAt)}</>
                    )}
                  </p>
                </div>
                <div className="sub-actions">
                  <button
                    className="check-btn"
                    onClick={() => handleCheckUpdate(sub.id)}
                    disabled={checking}
                  >
                    {checking ? '检查中...' : '🔍 检查更新'}
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(sub.id)}>
                    取消订阅
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-list">
          {changeRecords.length === 0 ? (
            <div className="empty-subs">
              <p>暂无变更历史</p>
              <p className="hint">订阅后点击「检查更新」将记录变更历史</p>
            </div>
          ) : (
            changeRecords.map((record) => {
              const sub = subscriptions.find((s) => s.id === record.subscriptionId);
              return (
                <div key={record.id} className={`history-card ${record.status}`}>
                  <div className="history-header">
                    <span className={`status-badge ${record.status}`}>
                      {record.status === 'changed' ? '已变更' : record.status === 'new' ? '新增' : '无变化'}
                    </span>
                    <span className="history-time">{formatRelativeTime(record.detectedAt)}</span>
                  </div>
                  <p className="history-target">{sub?.targetName || '未知'}</p>
                  {record.changes.length > 0 ? (
                    <div className="changes-list">
                      {record.changes.map((change, idx) => (
                        <div key={idx} className="change-item">
                          <span className="change-field">{change.field}</span>
                          <span className="change-old">{String(change.oldValue || '无')}</span>
                          <span className="arrow">→</span>
                          <span className="change-new">{String(change.newValue || '无')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-changes">未检测到明显变更</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        .subscriptions-view { max-width: 800px; margin: 0 auto; }
        .subs-header { margin-bottom: 20px; }
        .subs-header h2 { font-size: 22px; margin: 0 0 4px; color: #111827; }
        .subs-header p { color: #6b7280; font-size: 14px; margin: 0; }
        .pending-banner {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          color: #92400e;
          font-size: 14px;
        }
        .tab-bar {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 20px;
        }
        .tab {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
        }
        .tab.active { color: #4f46e5; border-bottom-color: #4f46e5; font-weight: 600; }
        .subs-list { display: flex; flex-direction: column; gap: 12px; }
        .empty-subs {
          text-align: center;
          padding: 48px;
          background: white;
          border-radius: 12px;
          color: #6b7280;
        }
        .empty-subs .hint { font-size: 13px; margin-top: 8px; }
        .sub-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .sub-type-badge {
          background: #e0e7ff;
          color: #4338ca;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 4px;
          display: inline-block;
        }
        .sub-info h4 { margin: 0 0 4px; font-size: 16px; color: #111827; }
        .sub-meta { margin: 0; font-size: 12px; color: #9ca3af; }
        .sub-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .check-btn, .delete-btn {
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          border: 1px solid;
          transition: all 0.2s;
        }
        .check-btn {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }
        .check-btn:hover:not(:disabled) { background: #4338ca; }
        .check-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .delete-btn {
          background: white;
          color: #dc2626;
          border-color: #fca5a5;
        }
        .delete-btn:hover { background: #fee2e2; }
        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          border-left: 4px solid #e5e7eb;
        }
        .history-card.changed { border-left-color: #f59e0b; }
        .history-card.new { border-left-color: #10b981; }
        .history-card.unchanged { border-left-color: #6b7280; }
        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .status-badge {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }
        .status-badge.changed { background: #fef3c7; color: #92400e; }
        .status-badge.new { background: #d1fae5; color: #065f46; }
        .status-badge.unchanged { background: #f3f4f6; color: #6b7280; }
        .history-time { font-size: 12px; color: #9ca3af; }
        .history-target { font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 8px; }
        .changes-list { display: flex; flex-direction: column; gap: 6px; }
        .change-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          background: #f9fafb;
          padding: 6px 10px;
          border-radius: 6px;
        }
        .change-field { font-weight: 600; color: #374151; min-width: 80px; }
        .change-old { color: #dc2626; text-decoration: line-through; }
        .arrow { color: #9ca3af; }
        .change-new { color: #059669; font-weight: 500; }
        .no-changes { font-size: 13px; color: #9ca3af; margin: 0; }
      `}</style>
    </div>
  );
}
