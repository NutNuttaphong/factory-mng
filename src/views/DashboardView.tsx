import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Activity, Clock, ShieldCheck, Factory, AlertTriangle, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { DashboardKPIs, SalesAndCostsChartItem, ProductionBreakdown, DashboardRecentLog } from '../types';

interface DashboardViewProps {
  kpis: DashboardKPIs;
  salesAndCostsChart?: SalesAndCostsChartItem[];
  productionBreakdown?: ProductionBreakdown;
  recentLogs?: DashboardRecentLog[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  salesAndCostsChart,
  productionBreakdown,
  recentLogs = [],
}) => {
  // Normalize chart data
  const chartData = useMemo(() => {
    if (salesAndCostsChart && salesAndCostsChart.length > 0) {
      return salesAndCostsChart.map((c) => ({
        month: c.month,
        Sales: c.Sales ?? c.sales ?? 0,
        Costs: c.Costs ?? c.costs ?? 0,
      }));
    }
    return [
      { month: 'Jan', Sales: kpis.totalSales * 0.15, Costs: kpis.totalPurchasing * 0.16 },
      { month: 'Feb', Sales: kpis.totalSales * 0.18, Costs: kpis.totalPurchasing * 0.15 },
      { month: 'Mar', Sales: kpis.totalSales * 0.22, Costs: kpis.totalPurchasing * 0.20 },
      { month: 'Apr', Sales: kpis.totalSales * 0.20, Costs: kpis.totalPurchasing * 0.18 },
      { month: 'May', Sales: kpis.totalSales * 0.25, Costs: kpis.totalPurchasing * 0.31 },
      { month: 'Jun', Sales: kpis.totalSales, Costs: kpis.totalPurchasing },
    ];
  }, [salesAndCostsChart, kpis.totalSales, kpis.totalPurchasing]);

  // Production pipeline data
  const pb = productionBreakdown || {
    draft: 0,
    pendingMaterial: 0,
    materialIssued: 0,
    inProduction: kpis.activeWOs,
    pendingQA: 0,
    completed: 0,
  };
  const totalWOs = pb.draft + pb.pendingMaterial + pb.materialIssued + pb.inProduction + pb.pendingQA + pb.completed;

  // Margin percentage
  const netMargin = kpis.netMargin ?? (kpis.totalSales - kpis.totalPurchasing);
  const marginPct = kpis.totalSales > 0 ? ((netMargin / kpis.totalSales) * 100).toFixed(1) : '0';

  const stages = [
    { label: 'Draft', count: pb.draft, color: '#9CA3AF', desc: 'Planning' },
    { label: 'Awaiting Material', count: pb.pendingMaterial, color: '#F59E0B', desc: 'BOM Check' },
    { label: 'Material Issued', count: pb.materialIssued, color: '#3B82F6', desc: 'Ready to Run' },
    { label: 'In Production', count: pb.inProduction, color: '#FF7A00', desc: 'Active Line' },
    { label: 'Pending QA', count: pb.pendingQA, color: '#8B5CF6', desc: 'Quality Gate' },
    { label: 'Completed', count: pb.completed, color: '#22C55E', desc: 'Finished Goods' },
  ];

  return (
    <div>
      {/* 5 KPI Metric Cards */}
      <div className="dashboard-grid">
        <div className="kpi-card">
          <span className="kpi-label">Sales Value (Delivered)</span>
          <span className="kpi-value">{kpis.totalSales.toLocaleString()} THB</span>
          <span className="kpi-change positive">
            <TrendingUp size={14} /> Revenue Realized
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Procurement Costs (Approved)</span>
          <span className="kpi-value">{kpis.totalPurchasing.toLocaleString()} THB</span>
          <span className="kpi-change negative">
            <TrendingDown size={14} /> Material Costs
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Net Profit Margin</span>
          <span className="kpi-value" style={{ color: netMargin >= 0 ? '#22C55E' : '#EF4444' }}>
            {netMargin.toLocaleString()} THB
          </span>
          <span className={`kpi-change ${netMargin >= 0 ? 'positive' : 'negative'}`}>
            {netMargin >= 0 ? `📈 +${marginPct}% Margin` : `📉 ${marginPct}% Deficit`}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Active Work Orders</span>
          <span className="kpi-value">{kpis.activeWOs} Runs</span>
          <span className="kpi-change positive">
            <Factory size={14} /> In Production
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Material Stock Alerts</span>
          <span className="kpi-value" style={{ color: kpis.lowStockItems > 0 ? '#EF4444' : '#FFFFFF' }}>
            {kpis.lowStockItems} Items
          </span>
          <span className={`kpi-change ${kpis.lowStockItems > 0 ? 'negative' : 'positive'}`}>
            {kpis.lowStockItems > 0 ? (
              <>
                <AlertTriangle size={14} /> Shortage Risk
              </>
            ) : (
              <>
                <ShieldCheck size={14} /> Normal Stock Levels
              </>
            )}
          </span>
        </div>
      </div>

      {/* Row 1: Sales vs Costs + QA Pass Rate */}
      <div className="chart-grid">
        {/* Sales vs Costs Graph */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Sales Revenues vs Procurement Costs</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 400 }}>6-Month Financial Trend</span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF7A00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D333F" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B21', borderColor: '#2D333F', color: '#FFFFFF', borderRadius: '6px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} THB`]}
                />
                <Legend />
                <Area type="monotone" dataKey="Sales" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="Costs" stroke="#FF7A00" strokeWidth={2} fillOpacity={1} fill="url(#colorCosts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Metrics Donut */}
        <div className="card">
          <div className="card-title">QA Inspection Pass Rate</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="#181B21"></circle>
                <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#2D333F" strokeWidth="3.5"></circle>
                <circle
                  className="donut-segment"
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={kpis.qaPassRate >= 90 ? '#22C55E' : kpis.qaPassRate >= 75 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="3.5"
                  strokeDasharray={`${kpis.qaPassRate} ${100 - kpis.qaPassRate}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>{kpis.qaPassRate}%</span>
                <span style={{ display: 'block', fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Passed</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '18px', fontSize: '12px' }}>
              <span style={{ color: '#22C55E', fontWeight: 600 }}>● Pass: {kpis.qaPassRate}%</span>
              <span style={{ color: '#EF4444', fontWeight: 600 }}>● Scrap: {100 - kpis.qaPassRate}%</span>
            </div>
            <span style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF' }}>
              Standard: {kpis.qaPassRate >= 95 ? '⭐ Excellent' : kpis.qaPassRate >= 90 ? '✓ Standard' : '⚠️ Attention Needed'}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Production Status Breakdown + Recent Activity Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Production Lifecycle Breakdown */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#FF7A00' }} />
              Production Orders Lifecycle Breakdown
            </span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Total: {totalWOs} Work Orders</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
            {stages.map((st, i) => {
              const pct = totalWOs > 0 ? Math.round((st.count / totalWOs) * 100) : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: st.color,
                          display: 'inline-block',
                        }}
                      />
                      <strong style={{ color: '#E5E7EB' }}>{st.label}</strong>
                      <span style={{ color: '#6B7280', fontSize: '11px' }}>({st.desc})</span>
                    </span>
                    <span style={{ fontWeight: 600, color: st.count > 0 ? '#FFFFFF' : '#6B7280' }}>
                      {st.count} {st.count === 1 ? 'WO' : 'WOs'} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#13161C', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(st.count > 0 ? 5 : 0, pct)}%`,
                        height: '100%',
                        backgroundColor: st.color,
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Security & System Activity Widget */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#22C55E' }} />
              Recent System & Audit Activity
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Live Logs</span>
          </div>

          {recentLogs.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
              <Clock size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>No recent activity registered in this session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              {recentLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: '#13161C',
                    border: '1px solid #1F242D',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor:
                            log.action === 'CREATE' || log.action === 'APPROVE'
                              ? '#064E3B'
                              : log.action === 'REJECT' || log.action === 'DELETE'
                              ? '#7F1D1D'
                              : '#1E293B',
                          color:
                            log.action === 'CREATE' || log.action === 'APPROVE'
                              ? '#34D399'
                              : log.action === 'REJECT' || log.action === 'DELETE'
                              ? '#F87171'
                              : '#93C5FD',
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#E5E7EB' }}>{log.entityName}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{log.userEmail || 'System Operator'}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {log.createdAt ? log.createdAt.split('T')[0] : 'Just now'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
