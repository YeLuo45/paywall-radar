import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSyncing, setError } from '../../store/slices/casesSlice';
import { paywallScreensProvider } from '../../providers/PaywallScreensProvider';
import { db } from '../../db';
import type { PaywallCase } from '../../types';

export default function SyncPanel() {
  const dispatch = useAppDispatch();
  const syncing = useAppSelector((s) => s.cases.syncing);
  const totalCount = useAppSelector((s) => s.cases.totalCount);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [pagesToFetch, setPagesToFetch] = useState(5);

  const addLog = useCallback((msg: string) => {
    setSyncLog((prev) => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    dispatch(setSyncing(true));
    dispatch(setError(null));
    setSyncLog([]);

    try {
      const totalPages = pagesToFetch;
      setProgress({ current: 0, total: totalPages, phase: '抓取中...' });
      addLog(`开始同步: 共 ${totalPages} 页`);

      const allRaw: Awaited<ReturnType<typeof paywallScreensProvider.parse>> = [];

      for (let page = 1; page <= totalPages; page++) {
        setProgress((p) => ({ ...p, current: page, phase: `抓取第 ${page}/${totalPages} 页...` }));
        addLog(`抓取第 ${page}/${totalPages} 页...`);

        const url = paywallScreensProvider.getListingURL(page);
        try {
          const html = await paywallScreensProvider.fetch(url);
          const rawCases = await paywallScreensProvider.parse(html);
          allRaw.push(...rawCases);
          addLog(`解析到 ${rawCases.length} 个案例`);
        } catch (err) {
          addLog(`第 ${page} 页抓取失败: ${err instanceof Error ? err.message : 'Unknown'}`);
        }

        // Small delay between pages to be polite
        if (page < totalPages) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      addLog(`共解析 ${allRaw.length} 个原始案例，开始标准化...`);
      setProgress((p) => ({ ...p, phase: '标准化数据...' }));

      const cases: PaywallCase[] = allRaw.map((raw) =>
        paywallScreensProvider.normalize(raw)
      );

      addLog(`标准化完成，存入 IndexedDB...`);
      setProgress((p) => ({ ...p, phase: '存储中...' }));

      await db.upsertCases(cases);

      const storedCount = await db.getCaseCount();
      addLog(`存储完成！当前数据库共 ${storedCount} 个案例`);

      // Also generate some sample data if DB is empty
      if (storedCount === 0 && cases.length === 0) {
        await generateSampleData();
        addLog('已生成示例数据用于演示');
      }

      setProgress((p) => ({ ...p, phase: '完成！' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '同步失败';
      addLog(`错误: ${msg}`);
      dispatch(setError(msg));
    } finally {
      dispatch(setSyncing(false));
    }
  };

  const generateSampleData = async () => {
    const sampleApps = [
      { appName: 'Spotify', developer: 'Spotify AB', category: '音乐', rating: 4.5, revenue: 'gt_1m', paywallType: 'subscription' as const, priceRange: '$9.99/月起' },
      { appName: 'Netflix', developer: 'Netflix Inc.', category: '视频', rating: 4.3, revenue: 'gt_1m', paywallType: 'subscription' as const, priceRange: '$6.99/月起' },
      { appName: 'Duolingo', developer: 'Duolingo Inc.', category: '教育', rating: 4.7, revenue: '100k_1m', paywallType: 'freemium' as const, priceRange: '免费+付费订阅' },
      { appName: 'Headspace', developer: 'Headspace Inc.', category: '健身', rating: 4.6, revenue: '10k_100k', paywallType: 'subscription' as const, priceRange: '$12.99/月起' },
      { appName: 'Notion', developer: 'Notion Labs', category: '工具', rating: 4.8, revenue: '100k_1m', paywallType: 'freemium' as const, priceRange: '免费+团队版' },
      { appName: 'Calm', developer: 'Calm.com', category: '健身', rating: 4.4, revenue: 'gt_1m', paywallType: 'subscription' as const, priceRange: '$14.99/月起' },
      { appName: 'YouTube Premium', developer: 'Google', category: '视频', rating: 4.2, revenue: 'gt_1m', paywallType: 'subscription' as const, priceRange: '$13.99/月' },
      { appName: 'Disney+', developer: 'Disney', category: '视频', rating: 4.1, revenue: 'gt_1m', paywallType: 'subscription' as const, priceRange: '$7.99/月起' },
      { appName: 'Slack', developer: 'Salesforce', category: '商务', rating: 4.3, revenue: 'gt_1m', paywallType: 'freemium' as const, priceRange: '免费+付费' },
      { appName: 'Canva', developer: 'Canva Pty Ltd', category: '工具', rating: 4.6, revenue: '100k_1m', paywallType: 'freemium' as const, priceRange: '免费+Pro' },
      { appName: ' Tinder', developer: 'Match Group', category: '社交', rating: 3.8, revenue: 'gt_1m', paywallType: 'freemium' as const, priceRange: '免费+Gold' },
      { appName: 'Dropbox', developer: 'Dropbox Inc.', category: '工具', rating: 4.1, revenue: 'gt_1m', paywallType: 'freemium' as const, priceRange: '2GB免费' },
      { appName: 'Coursera', developer: 'Coursera Inc.', category: '教育', rating: 4.4, revenue: '100k_1m', paywallType: 'freemium' as const, priceRange: '免费课程' },
      { appName: 'Amazon Kindle', developer: 'Amazon', category: '图书', rating: 4.2, revenue: 'gt_1m', paywallType: 'freemium' as const, priceRange: '电子书购买' },
      { appName: 'Audible', developer: 'Amazon', category: '音乐', rating: 4.5, revenue: 'gt_1m', paywallType: 'subscription' as const, priceRange: '$14.95/月' },
      { appName: 'Evernote', developer: 'Evernote Corp.', category: '工具', rating: 3.9, revenue: '10k_100k', paywallType: 'freemium' as const, priceRange: '免费+专业版' },
      { appName: '1Password', developer: 'AgileBits', category: '工具', rating: 4.7, revenue: '10k_100k', paywallType: 'subscription' as const, priceRange: '$2.99/月' },
      { appName: 'Strava', developer: 'Strava Inc.', category: '健身', rating: 4.4, revenue: '10k_100k', paywallType: 'freemium' as const, priceRange: '免费+订阅' },
      { appName: 'TikTok', developer: 'ByteDance', category: '社交', rating: 4.2, revenue: 'gt_1m', paywallType: 'freemium' as const, priceRange: '免费' },
      { appName: 'Instagram', developer: 'Meta', category: '社交', rating: 4.3, revenue: 'gt_1m', paywallType: 'freemium' as const, priceRange: '免费' },
    ];

    const cases: PaywallCase[] = sampleApps.map((app, idx) => ({
      id: `sample_${idx}_${Date.now()}`,
      appName: app.appName,
      developer: app.developer,
      iconUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(app.appName)}&background=4f46e5&color=fff&size=128`,
      thumbnailUrl: `https://picsum.photos/seed/${app.appName}/300/500`,
      screenshotUrl: `https://picsum.photos/seed/${app.appName}/600/1000`,
      category: app.category,
      tags: [app.category, '热门'],
      revenueRange: app.revenue as PaywallCase['revenueRange'],
      rating: app.rating,
      version: '1.0',
      paywallType: app.paywallType,
      priceRange: app.priceRange,
      description: `${app.appName} 是一款优秀的${app.category}应用，采用${app.paywallType === 'subscription' ? '订阅制' : app.paywallType === 'freemium' ? '免费增值模式' : '其他'}收费模式。`,
      sourceUrl: 'https://paywallscreens.com',
      fetchedAt: Date.now() - idx * 86400000,
      updatedAt: Date.now(),
    }));

    await db.upsertCases(cases);
  };

  return (
    <div className="sync-panel">
      <div className="sync-header">
        <h2>数据同步</h2>
        <p>从 paywallscreens.com 抓取付费墙案例数据</p>
      </div>

      <div className="sync-status-card">
        <div className="status-row">
          <span className="status-label">数据库状态</span>
          <span className="status-value">
            {totalCount > 0 ? `✓ ${totalCount} 个案例已存储` : '尚未同步数据'}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">CORS 扩展</span>
          <span className="status-value hint">
            💡 请确保已安装浏览器扩展以绕过 CORS 限制
          </span>
        </div>
      </div>

      <div className="sync-controls">
        <div className="control-group">
          <label>抓取页数</label>
          <select
            value={pagesToFetch}
            onChange={(e) => setPagesToFetch(Number(e.target.value))}
            disabled={syncing}
          >
            <option value={1}>1 页 (~20案例)</option>
            <option value={5}>5 页 (~100案例)</option>
            <option value={10}>10 页 (~200案例)</option>
            <option value={20}>20 页 (~400案例)</option>
          </select>
        </div>

        <button
          className={`sync-btn ${syncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? '🔄 同步中...' : '🚀 开始同步'}
        </button>

        <button
          className="demo-btn"
          onClick={async () => {
            await generateSampleData();
            addLog('已生成 20 条示例数据');
          }}
          disabled={syncing}
        >
          📱 加载示例数据
        </button>
      </div>

      {syncing && (
        <div className="progress-bar-container">
          <div className="progress-info">
            <span>{progress.phase}</span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(progress.current / Math.max(progress.total, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="sync-log">
        <h4>同步日志</h4>
        <div className="log-box">
          {syncLog.length === 0 ? (
            <p className="log-empty">暂无日志</p>
          ) : (
            syncLog.map((line, idx) => <p key={idx}>{line}</p>)
          )}
        </div>
      </div>

      <div className="extension-guide">
        <h4>🔌 浏览器扩展安装指南</h4>
        <ol>
          <li>打开 Chrome，进入 <code>chrome://extensions/</code></li>
          <li>开启右上角「开发者模式」</li>
          <li>点击「加载解压的扩展程序」</li>
          <li>选择项目中的 <code>extension/</code> 文件夹</li>
          <li>扩展激活后刷新页面即可开始抓取</li>
        </ol>
        <p className="guide-note">
          注意：扩展仅在访问 paywallscreens.com 时生效，不会影响其他网站。
        </p>
      </div>

      <style>{`
        .sync-panel { max-width: 800px; margin: 0 auto; }
        .sync-header { margin-bottom: 24px; }
        .sync-header h2 { font-size: 22px; margin: 0 0 4px; color: #111827; }
        .sync-header p { color: #6b7280; font-size: 14px; margin: 0; }
        .sync-status-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }
        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .status-row:last-child { border-bottom: none; }
        .status-label { font-size: 14px; font-weight: 500; color: #374151; }
        .status-value { font-size: 14px; color: #111827; }
        .status-value.hint { color: #92400e; background: #fef3c7; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
        .sync-controls {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .control-group { display: flex; flex-direction: column; gap: 4px; }
        .control-group label { font-size: 13px; font-weight: 500; color: #374151; }
        .control-group select {
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        .sync-btn {
          flex: 1;
          padding: 12px 24px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.2s;
          font-weight: 600;
        }
        .sync-btn:hover:not(:disabled) { background: #4338ca; }
        .sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sync-btn.syncing { background: #6b7280; }
        .demo-btn {
          padding: 12px 20px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #374151;
        }
        .demo-btn:hover:not(:disabled) { background: #f3f4f6; }
        .demo-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .progress-bar-container { margin-bottom: 20px; }
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #4f46e5;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .sync-log {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }
        .sync-log h4 { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: #374151; }
        .log-box {
          background: #1e1e2e;
          border-radius: 8px;
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
        }
        .log-box p { margin: 0 0 4px; font-size: 12px; color: #a6e3a1; font-family: monospace; }
        .log-empty { color: #6b7280 !important; }
        .extension-guide {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 20px;
        }
        .extension-guide h4 { font-size: 15px; margin: 0 0 12px; color: #92400e; }
        .extension-guide ol { margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 2; }
        .extension-guide code {
          background: #fef3c7;
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 13px;
          font-family: monospace;
        }
        .guide-note { font-size: 12px; color: #a16207; margin: 12px 0 0; }
      `}</style>
    </div>
  );
}
