import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, clearFilters } from '../../store/slices/casesSlice';
import {
  CATEGORIES,
  REVENUE_RANGE_LABELS,
  type RevenueRange,
} from '../../types';

interface FilterPanelProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function FilterPanel({
  collapsed = false,
  onToggleCollapse,
}: FilterPanelProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.cases.filters);

  const handleCategoryToggle = (cat: string) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    dispatch(setFilters({ categories: cats }));
  };

  const handleRevenueToggle = (range: RevenueRange) => {
    const ranges = filters.revenueRanges.includes(range)
      ? filters.revenueRanges.filter((r) => r !== range)
      : [...filters.revenueRanges, range];
    dispatch(setFilters({ revenueRanges: ranges }));
  };

  const handleRatingChange = (type: 'min' | 'max', value: number) => {
    if (type === 'min') {
      dispatch(setFilters({ ratingMin: value }));
    } else {
      dispatch(setFilters({ ratingMax: value }));
    }
  };

  const handleSortChange = (sortBy: string) => {
    dispatch(setFilters({ sortBy: sortBy as 'appName' | 'rating' | 'fetchedAt' | 'updatedAt' }));
  };

  return (
    <div className={`filter-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="filter-header">
        <h3>筛选条件</h3>
        <button className="clear-btn" onClick={() => dispatch(clearFilters())}>
          清除筛选
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Category Filter */}
          <div className="filter-section">
            <h4>应用分类</h4>
            <div className="filter-tags">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`filter-tag ${filters.categories.includes(cat) ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue Filter */}
          <div className="filter-section">
            <h4>收入区间</h4>
            <div className="filter-tags">
              {(Object.keys(REVENUE_RANGE_LABELS) as RevenueRange[]).map((range) => (
                <button
                  key={range}
                  className={`filter-tag ${filters.revenueRanges.includes(range) ? 'active' : ''}`}
                  onClick={() => handleRevenueToggle(range)}
                >
                  {REVENUE_RANGE_LABELS[range]}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h4>评分区间</h4>
            <div className="rating-range">
              <label>
                <span>最低: {filters.ratingMin} ★</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.ratingMin}
                  onChange={(e) => handleRatingChange('min', parseFloat(e.target.value))}
                />
              </label>
              <label>
                <span>最高: {filters.ratingMax} ★</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.ratingMax}
                  onChange={(e) => handleRatingChange('max', parseFloat(e.target.value))}
                />
              </label>
            </div>
          </div>

          {/* Sort */}
          <div className="filter-section">
            <h4>排序方式</h4>
            <select
              className="sort-select"
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="updatedAt">最近更新</option>
              <option value="fetchedAt">抓取时间</option>
              <option value="appName">应用名称</option>
              <option value="rating">评分</option>
            </select>
            <div className="sort-order">
              <button
                className={`sort-order-btn ${filters.sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => dispatch(setFilters({ sortOrder: 'desc' }))}
              >
                降序 ↓
              </button>
              <button
                className={`sort-order-btn ${filters.sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => dispatch(setFilters({ sortOrder: 'asc' }))}
              >
                升序 ↑
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .filter-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }
        .filter-panel.collapsed {
          padding: 12px 20px;
        }
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .filter-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }
        .clear-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 13px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }
        .clear-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }
        .filter-section {
          margin-bottom: 20px;
        }
        .filter-section:last-child {
          margin-bottom: 0;
        }
        .filter-section h4 {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .filter-tag {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          color: #374151;
        }
        .filter-tag:hover {
          background: #e0e7ff;
          border-color: #c7d2fe;
        }
        .filter-tag.active {
          background: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }
        .rating-range {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rating-range label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #374151;
        }
        .rating-range input[type="range"] {
          width: 100%;
          cursor: pointer;
        }
        .sort-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        .sort-order {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .sort-order-btn {
          flex: 1;
          padding: 6px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .sort-order-btn.active {
          background: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }
      `}</style>
    </div>
  );
}
