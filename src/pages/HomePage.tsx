import React, { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCases,
  setPage,
  setLoading,
  initGridDensity,
  setGridDensity,
} from '../store/slices/casesSlice';
import { db } from '../db';
import CaseGrid from '../components/CaseCard/CaseGrid';
import FilterPanel from '../components/FilterPanel/FilterPanel';
import SearchBar from '../components/FilterPanel/SearchBar';
import { GRID_DENSITIES } from '../types';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { filteredItems, gridDensity, page, pageSize, loading, totalCount } =
    useAppSelector((s) => s.cases);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  useEffect(() => {
    dispatch(initGridDensity());
    loadInitialData();
  }, [dispatch]);

  const loadInitialData = async () => {
    dispatch(setLoading(true));
    try {
      const cases = await db.getAllCases();
      dispatch(setCases(cases));
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update the case count display
  useEffect(() => {
    const el = document.getElementById('case-count-display');
    if (el) {
      el.textContent = `${totalCount} 个案例`;
    }
  }, [totalCount]);

  const paginatedCases = filteredItems.slice(0, page * pageSize);
  const hasMore = paginatedCases.length < filteredItems.length;

  const handleLoadMore = useCallback(() => {
    dispatch(setPage(page + 1));
  }, [dispatch, page]);

  const handleGridChange = (cols: 2 | 3 | 4) => {
    dispatch(setGridDensity(cols));
  };

  return (
    <div className="home-page">
      <div className="home-toolbar">
        <SearchBar />
        <div className="toolbar-right">
          <div className="grid-density">
            {GRID_DENSITIES.map((d) => (
              <button
                key={d.columns}
                className={`density-btn ${gridDensity === d.columns ? 'active' : ''}`}
                onClick={() => handleGridChange(d.columns)}
                title={`${d.columns}列网格`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            className="filter-toggle-btn"
            onClick={() => setFilterCollapsed(!filterCollapsed)}
          >
            {filterCollapsed ? '🔽 显示筛选' : '🔼 隐藏筛选'}
          </button>
        </div>
      </div>

      <FilterPanel
        collapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
      />

      <div className="results-info">
        <span>
          共 {filteredItems.length} 个案例
          {filteredItems.length !== totalCount && `（已筛选，共 ${totalCount} 个）`}
        </span>
      </div>

      <CaseGrid
        cases={paginatedCases}
        gridDensity={gridDensity}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />

      <style>{`
        .home-page { width: 100%; }
        .home-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 0;
          flex-wrap: wrap;
        }
        .home-toolbar .search-bar { flex: 1; min-width: 280px; margin-bottom: 0; }
        .toolbar-right { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .grid-density {
          display: flex;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }
        .density-btn {
          padding: 6px 12px;
          background: white;
          border: none;
          border-right: 1px solid #d1d5db;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          transition: all 0.2s;
        }
        .density-btn:last-child { border-right: none; }
        .density-btn.active { background: #4f46e5; color: white; }
        .filter-toggle-btn {
          padding: 6px 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          white-space: nowrap;
        }
        .results-info {
          margin-bottom: 16px;
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
