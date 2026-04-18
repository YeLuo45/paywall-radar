import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters } from '../../store/slices/casesSlice';
import { useDebounce } from '../../hooks';

export default function SearchBar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.cases.filters);
  const [localKeyword, setLocalKeyword] = useState(filters.keyword);
  const debouncedKeyword = useDebounce(localKeyword, 300);

  useEffect(() => {
    dispatch(setFilters({ keyword: debouncedKeyword }));
  }, [debouncedKeyword, dispatch]);

  const handleClear = useCallback(() => {
    setLocalKeyword('');
  }, []);

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索应用名称、开发商、分类..."
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
        />
        {localKeyword && (
          <button className="search-clear" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>

      <style>{`
        .search-bar {
          margin-bottom: 16px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          font-size: 16px;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 12px 40px 12px 42px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
        }
        .search-input::placeholder {
          color: #9ca3af;
        }
        .search-clear {
          position: absolute;
          right: 12px;
          background: #e5e7eb;
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: background 0.2s;
        }
        .search-clear:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
