import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  addFolder,
  removeFolder,
  setActiveFolder,
  removeItem,
  updateItem,
} from '../../store/slices/favoritesSlice';
import CaseCard from '../CaseCard/CaseCard';
import type { FavoriteItem } from '../../types';

export default function FavoritesView() {
  const dispatch = useAppDispatch();
  const { folders, items, activeFolderId } = useAppSelector((s) => s.favorites);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<FavoriteItem | null>(null);
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const activeItems = items.filter((i) => i.folderId === activeFolderId);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    dispatch(addFolder({ name: newFolderName.trim() }));
    setNewFolderName('');
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm('确定要删除这个收藏夹吗？')) {
      dispatch(removeFolder(id));
    }
  };

  const handleRemoveItem = (folderId: string, caseId: string) => {
    dispatch(removeItem({ folderId, caseId }));
  };

  const handleStartEdit = (item: FavoriteItem) => {
    setEditingItem(item);
    setEditTags(item.customTags.join(', '));
    setEditNotes(item.notes);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    dispatch(
      updateItem({
        id: editingItem.id,
        customTags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        notes: editNotes,
      })
    );
    setEditingItem(null);
  };

  return (
    <div className="favorites-view">
      <div className="favorites-sidebar">
        <h3>收藏夹</h3>
        <div className="folder-list">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`folder-item ${folder.id === activeFolderId ? 'active' : ''}`}
              onClick={() => dispatch(setActiveFolder(folder.id))}
            >
              <span className="folder-name">📁 {folder.name}</span>
              <span className="folder-count">
                {items.filter((i) => i.folderId === folder.id).length}
              </span>
              <button
                className="folder-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <div className="new-folder">
          <input
            type="text"
            placeholder="新建收藏夹名称..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <button onClick={handleCreateFolder}>+</button>
        </div>
      </div>

      <div className="favorites-content">
        {activeFolderId ? (
          <>
            <div className="content-header">
              <h2>
                {folders.find((f) => f.id === activeFolderId)?.name || '收藏夹'}
              </h2>
              <span className="item-count">{activeItems.length} 个案例</span>
            </div>

            {activeItems.length === 0 ? (
              <div className="empty-favorites">
                <p>该收藏夹暂无案例</p>
              </div>
            ) : (
              <div className="favorites-grid">
                {activeItems.map((item) => (
                  <div key={item.id} className="favorite-item-wrapper">
                    <CaseCard
                      caseData={item.caseSnapshot}
                      onFavoriteToggle={() =>
                        handleRemoveItem(item.folderId, item.caseId)
                      }
                    />
                    <div className="item-actions">
                      <button
                        className="item-edit-btn"
                        onClick={() => handleStartEdit(item)}
                      >
                        标签/笔记
                      </button>
                      <button
                        className="item-remove-btn"
                        onClick={() =>
                          handleRemoveItem(item.folderId, item.caseId)
                        }
                      >
                        移除
                      </button>
                    </div>
                    {item.customTags.length > 0 && (
                      <div className="item-tags">
                        {item.customTags.map((t) => (
                          <span key={t} className="tag">{t}</span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <div className="item-notes">{item.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-folder-selected">
            <p>请选择一个收藏夹或创建新收藏夹</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>编辑标签和笔记</h3>
            <div className="form-group">
              <label>自定义标签（逗号分隔）</label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="如：参考, 订阅制, 高转化"
              />
            </div>
            <div className="form-group">
              <label>笔记</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="记录你的分析笔记..."
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setEditingItem(null)}>取消</button>
              <button className="primary" onClick={handleSaveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .favorites-view {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
        }
        .favorites-sidebar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          height: fit-content;
        }
        .favorites-sidebar h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #111827;
        }
        .folder-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
        .folder-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .folder-item:hover { background: #f3f4f6; }
        .folder-item.active { background: #e0e7ff; }
        .folder-name { flex: 1; font-size: 14px; color: #374151; }
        .folder-count {
          background: #e5e7eb;
          color: #6b7280;
          border-radius: 10px;
          padding: 0 8px;
          font-size: 12px;
          min-width: 24px;
          text-align: center;
        }
        .folder-item.active .folder-count { background: #c7d2fe; color: #4338ca; }
        .folder-delete { background: none; border: none; cursor: pointer; opacity: 0; font-size: 12px; }
        .folder-item:hover .folder-delete { opacity: 1; }
        .new-folder { display: flex; gap: 8px; }
        .new-folder input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
        }
        .new-folder button {
          padding: 8px 12px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }
        .favorites-content { min-width: 0; }
        .content-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .content-header h2 { font-size: 20px; margin: 0; color: #111827; }
        .item-count { color: #6b7280; font-size: 14px; }
        .empty-favorites, .no-folder-selected {
          text-align: center;
          padding: 64px;
          color: #9ca3af;
          background: white;
          border-radius: 12px;
        }
        .favorites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .favorite-item-wrapper { position: relative; }
        .item-actions {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
        .item-edit-btn, .item-remove-btn {
          flex: 1;
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .item-edit-btn:hover { background: #e0e7ff; border-color: #c7d2fe; }
        .item-remove-btn:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
        .item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .item-tags .tag {
          background: #fef3c7;
          color: #92400e;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 11px;
        }
        .item-notes {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          padding: 6px 8px;
          background: #f9fafb;
          border-radius: 4px;
          border-left: 3px solid #4f46e5;
        }
        .edit-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 500;
        }
        .edit-modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 400px;
          max-width: 90vw;
        }
        .edit-modal-content h3 { margin: 0 0 16px; font-size: 16px; color: #111827; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 4px; }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          resize: vertical;
        }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .modal-actions button {
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          border: 1px solid #d1d5db;
          background: white;
        }
        .modal-actions button.primary { background: #4f46e5; color: white; border-color: #4f46e5; }
        @media (max-width: 768px) {
          .favorites-view { grid-template-columns: 1fr; }
          .favorites-sidebar { order: -1; }
        }
      `}</style>
    </div>
  );
}
