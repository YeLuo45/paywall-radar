import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaywallCase } from '../../types';
import { REVENUE_RANGE_LABELS, PAYWALL_TYPE_LABELS } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store';
import { addItem } from '../../store/slices/favoritesSlice';
import { generateId } from '../../utils';

interface CaseCardProps {
  caseData: PaywallCase;
  onFavoriteToggle?: (caseData: PaywallCase) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (caseData: PaywallCase) => void;
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating);
  return (
    <span className="star-rating" title={`评分: ${rating}`}>
      {'★'.repeat(stars)}
      {'☆'.repeat(5 - stars)}
    </span>
  );
}

export default function CaseCard({
  caseData,
  onFavoriteToggle,
  selectable = false,
  selected = false,
  onSelect,
}: CaseCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const folders = useAppSelector((s) => s.favorites.folders);
  const activeFolderId = useAppSelector((s) => s.favorites.activeFolderId);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(caseData);
    } else {
      navigate(`/case/${caseData.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFolderId) {
      alert('请先创建一个收藏夹');
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
    setShowMenu(false);
  };

  const handleImageLoad = () => setImgLoaded(true);
  const handleImageError = () => {
    setImgError(true);
    setImgLoaded(true);
  };

  return (
    <div
      className={`case-card ${selectable ? 'selectable' : ''} ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${caseData.appName} 案例卡片`}
    >
      {selectable && (
        <div className="card-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(caseData)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="card-thumbnail">
        {!imgLoaded && <div className="img-placeholder" />}
        {imgError ? (
          <div className="img-error">📱</div>
        ) : (
          <img
            ref={imgRef}
            src={caseData.thumbnailUrl || caseData.iconUrl}
            alt={caseData.appName}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={imgLoaded ? 'loaded' : ''}
          />
        )}
        <div className="card-overlay">
          <button
            className="favorite-btn"
            onClick={handleFavorite}
            title="添加到收藏"
          >
            ⭐
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="card-header-row">
          {caseData.iconUrl && (
            <img
              src={caseData.iconUrl}
              alt=""
              className="card-icon"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="card-title-block">
            <h3 className="card-title">{caseData.appName}</h3>
            <p className="card-developer">{caseData.developer}</p>
          </div>
        </div>

        <div className="card-meta">
          <span className="meta-tag category-tag">{caseData.category}</span>
          <span className="meta-tag revenue-tag">
            {REVENUE_RANGE_LABELS[caseData.revenueRange]}
          </span>
        </div>

        <div className="card-footer">
          <StarRating rating={caseData.rating} />
          <span className="paywall-type">
            {PAYWALL_TYPE_LABELS[caseData.paywallType]}
          </span>
        </div>
      </div>

      <style>{`
        .case-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: all 0.2s;
          cursor: pointer;
          border: 2px solid transparent;
          position: relative;
        }
        .case-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }
        .case-card.selectable {
          cursor: default;
        }
        .case-card.selected {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
        }
        .case-card:focus {
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }
        .card-checkbox {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
        }
        .card-checkbox input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        .card-thumbnail {
          position: relative;
          aspect-ratio: 9/16;
          background: #f3f4f6;
          overflow: hidden;
        }
        .card-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .card-thumbnail img.loaded {
          opacity: 1;
        }
        .img-placeholder,
        .img-error {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: #e5e7eb;
          color: #9ca3af;
        }
        .card-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .case-card:hover .card-overlay {
          opacity: 1;
        }
        .favorite-btn {
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .favorite-btn:hover {
          transform: scale(1.1);
        }
        .card-body {
          padding: 12px;
        }
        .card-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .card-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .card-title-block {
          flex: 1;
          min-width: 0;
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #111827;
        }
        .card-developer {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-meta {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .meta-tag {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        .category-tag {
          background: #e0e7ff;
          color: #4338ca;
        }
        .revenue-tag {
          background: #dcfce7;
          color: #166534;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .star-rating {
          color: #f59e0b;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .paywall-type {
          font-size: 11px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
