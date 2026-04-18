import React, { useRef, useEffect, useCallback } from 'react';
import CaseCard from './CaseCard';
import type { PaywallCase } from '../../types';

interface CaseGridProps {
  cases: PaywallCase[];
  gridDensity: 2 | 3 | 4;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (caseData: PaywallCase) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function CaseGrid({
  cases,
  gridDensity,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  onLoadMore,
  hasMore = false,
}: CaseGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (cases.length === 0 && !loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>暂无案例</h3>
        <p>请先同步数据或调整筛选条件</p>
        <style>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px 24px;
            text-align: center;
            color: #6b7280;
          }
          .empty-icon { font-size: 64px; margin-bottom: 16px; }
          .empty-state h3 { font-size: 18px; color: #374151; margin: 0 0 8px; }
          .empty-state p { font-size: 14px; margin: 0; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="case-grid-container">
      <div
        className="case-grid"
        style={{
          gridTemplateColumns: `repeat(${gridDensity}, 1fr)`,
        }}
      >
        {cases.map((c) => (
          <CaseCard
            key={c.id}
            caseData={c}
            selectable={selectable}
            selected={selectedIds.includes(c.id)}
            onSelect={onSelect}
          />
        ))}
      </div>

      {loading && (
        <div className="loading-more">
          <div className="spinner" />
          <span>加载中...</span>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: '1px' }} />

      <style>{`
        .case-grid-container {
          width: 100%;
        }
        .case-grid {
          display: grid;
          gap: 16px;
        }
        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          color: #6b7280;
          font-size: 14px;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .case-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px;
          }
        }
        @media (max-width: 480px) {
          .case-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
