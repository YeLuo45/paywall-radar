import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAppSelector } from '../../store';
import { REVENUE_RANGE_LABELS, type RevenueRange } from '../../types';

const COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#16a34a',
  '#0d9488',
  '#0891b2',
  '#2563eb',
  '#4338ca',
];

export default function TrendAnalysis() {
  const cases = useAppSelector((s) => s.cases.items);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [cases]);

  const revenueData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.revenueRange] = (counts[c.revenueRange] || 0) + 1;
    });
    return (Object.keys(REVENUE_RANGE_LABELS) as RevenueRange[]).map((range) => ({
      name: REVENUE_RANGE_LABELS[range],
      value: counts[range] || 0,
    }));
  }, [cases]);

  const ratingData = useMemo(() => {
    const buckets = [
      { name: '1-2★', min: 1, max: 2, count: 0 },
      { name: '2-3★', min: 2, max: 3, count: 0 },
      { name: '3-4★', min: 3, max: 4, count: 0 },
      { name: '4-5★', min: 4, max: 5, count: 0 },
    ];
    cases.forEach((c) => {
      const bucket = buckets.find((b) => c.rating >= b.min && c.rating < b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [cases]);

  const avgRating = useMemo(() => {
    if (cases.length === 0) return 0;
    return cases.reduce((sum, c) => sum + c.rating, 0) / cases.length;
  }, [cases]);

  if (cases.length === 0) {
    return (
      <div className="trend-empty">
        <div className="empty-icon">📈</div>
        <h3>趋势分析</h3>
        <p>请先同步数据后再查看趋势分析</p>
        <style>{`
          .trend-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 80px 24px;
            text-align: center;
          }
          .empty-icon { font-size: 64px; margin-bottom: 16px; }
          .trend-empty h3 { font-size: 20px; color: #111827; margin: 0 0 8px; }
          .trend-empty p { color: #6b7280; font-size: 14px; margin: 0; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="trend-analysis">
      <div className="trend-header">
        <h2>付费墙趋势分析</h2>
        <p>基于 {cases.length} 个案例数据</p>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{cases.length}</div>
          <div className="stat-label">案例总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{categoryData.length}</div>
          <div className="stat-label">覆盖分类数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgRating.toFixed(1)}</div>
          <div className="stat-label">平均评分</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Category Pie Chart */}
        <div className="chart-card">
          <h3>分类占比分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {categoryData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} 个`, '案例数']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Bar Chart */}
        <div className="chart-card">
          <h3>收入区间分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`${value} 个`, '案例数']} />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="chart-card">
          <h3>评分区间分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`${value} 个`, '案例数']} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .trend-analysis { max-width: 1200px; margin: 0 auto; }
        .trend-header { margin-bottom: 24px; }
        .trend-header h2 { font-size: 22px; margin: 0 0 4px; color: #111827; }
        .trend-header p { color: #6b7280; font-size: 14px; margin: 0; }
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 20px;
        }
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .chart-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #374151;
        }
        @media (max-width: 768px) {
          .stats-summary { grid-template-columns: 1fr; }
          .charts-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
