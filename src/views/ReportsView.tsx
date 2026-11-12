import React, { useMemo } from 'react';
import { Factory, Coins, Package, ShieldCheck, AlertOctagon } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell } from 'recharts';
import { Stock, WorkOrder, QualityInspection, SalesOrder, PurchaseOrder } from '../types';

interface ReportsViewProps {
  stocks: Stock[];
  kpis: {
    qaPassRate: number;
    totalSales?: number;
    totalPurchasing?: number;
    netMargin?: number;
  };
  workOrders?: WorkOrder[];
  inspections?: QualityInspection[];
  salesOrders?: SalesOrder[];
  purchaseOrders?: PurchaseOrder[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  stocks = [],
  kpis,
  workOrders = [],
  inspections = [],
  salesOrders = [],
  purchaseOrders = [],
}) => {
  // 1. Total Asset Valuation
  const totalValuation = useMemo(() => {
    return stocks.reduce((sum, st) => sum + st.quantity * (st.product?.cost || 0), 0);
  }, [stocks]);

  const totalUnits = useMemo(() => {
    return stocks.reduce((sum, st) => sum + st.quantity, 0);
  }, [stocks]);

  // 2. Valuation Breakdown by Product Type
  const valuationByType = useMemo(() => {
    const map: Record<string, number> = {
      RAW_MATERIAL: 0,
      FINISHED_GOOD: 0,
      PACKAGING: 0,
      SEMI_FINISHED: 0,
    };
    stocks.forEach((st) => {
      const type = st.product?.type || 'RAW_MATERIAL';
      const val = st.quantity * (st.product?.cost || 0);
      map[type] = (map[type] || 0) + val;
    });

    return [
      { name: 'Raw Material', value: map.RAW_MATERIAL || 0, color: '#3B82F6' },
      { name: 'Finished Good', value: map.FINISHED_GOOD || 0, color: '#22C55E' },
      { name: 'Packaging', value: map.PACKAGING || 0, color: '#F59E0B' },
      { name: 'Semi-Finished', value: map.SEMI_FINISHED || 0, color: '#8B5CF6' },
    ];
  }, [stocks]);

  // 3. QA Results Breakdown
  const qaBreakdown = useMemo(() => {
    const pass = inspections.filter((i) => i.status === 'PASS').length;
    const fail = inspections.filter((i) => i.status === 'FAIL').length;
    const rework = inspections.filter((i) => i.status === 'REWORK').length;
    const total = inspections.length || 1;

    return [
      { name: 'Pass', count: pass, pct: Math.round((pass / total) * 100), color: '#22C55E' },
      { name: 'Rework', count: rework, pct: Math.round((rework / total) * 100), color: '#F59E0B' },
      { name: 'Fail / Scrap', count: fail, pct: Math.round((fail / total) * 100), color: '#EF4444' },
    ];
  }, [inspections]);

  // 4. Top 6 Capital Tied-Up Stock Items
  const topValuedStocks = useMemo(() => {
    return [...stocks]
      .map((st) => ({
        id: st.id,
        code: st.product?.code || '-',
        name: st.product?.name || '-',
        type: st.product?.type || '-',
        quantity: st.quantity,
        unit: st.product?.unit?.name || 'Units',
        cost: st.product?.cost || 0,
        totalValue: st.quantity * (st.product?.cost || 0),
        sharePct: totalValuation > 0 ? ((st.quantity * (st.product?.cost || 0)) / totalValuation) * 100 : 0,
        status: st.status,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 6);
  }, [stocks, totalValuation]);

  // 5. Operational Fulfillment Metrics
  const fulfillment = useMemo(() => {
    const totalWO = workOrders.length || 1;
    const completedWO = workOrders.filter((w) => w.status === 'COMPLETED').length;
    const woRate = Math.round((completedWO / totalWO) * 100);

    const totalSO = salesOrders.length || 1;
    const deliveredSO = salesOrders.filter((s) => s.status === 'DELIVERED').length;
    const soRate = Math.round((deliveredSO / totalSO) * 100);

    const totalPO = purchaseOrders.length || 1;
    const approvedPO = purchaseOrders.filter((p) => p.status === 'APPROVED').length;
    const poRate = Math.round((approvedPO / totalPO) * 100);

    return {
      totalWO: workOrders.length,
      completedWO,
      woRate,
      totalSO: salesOrders.length,
      deliveredSO,
      soRate,
      totalPO: purchaseOrders.length,
      approvedPO,
      poRate,
    };
  }, [workOrders, salesOrders, purchaseOrders]);

  return (
    <div>
      {/* Operational Fulfillment Metric Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ backgroundColor: '#181B21', border: '1px solid #2D333F', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9CA3AF', marginBottom: '6px' }}>
            <span>Manufacturing Work Orders</span>
            <span style={{ color: '#22C55E', fontWeight: 600 }}>{fulfillment.woRate}% Done</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            {fulfillment.completedWO} / {fulfillment.totalWO} Completed
          </div>
        </div>

        <div style={{ backgroundColor: '#181B21', border: '1px solid #2D333F', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9CA3AF', marginBottom: '6px' }}>
            <span>Customer Sales Deliveries</span>
            <span style={{ color: '#3B82F6', fontWeight: 600 }}>{fulfillment.soRate}% Shipped</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            {fulfillment.deliveredSO} / {fulfillment.totalSO} Dispatched
          </div>
        </div>

        <div style={{ backgroundColor: '#181B21', border: '1px solid #2D333F', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9CA3AF', marginBottom: '6px' }}>
            <span>Purchase Orders Authorized</span>
            <span style={{ color: '#F59E0B', fontWeight: 600 }}>{fulfillment.poRate}% Active</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            {fulfillment.approvedPO} / {fulfillment.totalPO} Approved
          </div>
        </div>
      </div>

      {/* 4 Summary Analytics Cards */}
      <div className="dashboard-grid">
        <div className="kpi-card">
          <span className="kpi-label">Warehouse Asset Valuation</span>
          <span className="kpi-value" style={{ color: '#FF7A00' }}>
            {totalValuation.toLocaleString()} THB
          </span>
          <span className="kpi-change positive">
            <Coins size={14} /> Total Tied-Up Capital
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Total Inventory Physical Units</span>
          <span className="kpi-value">{totalUnits.toLocaleString()}</span>
          <span className="kpi-change positive">
            <Package size={14} /> In Stock Across Warehouses
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Production Yield Standard</span>
          <span className="kpi-value" style={{ color: '#22C55E' }}>
            {kpis.qaPassRate}%
          </span>
          <span className="kpi-change positive">
            <ShieldCheck size={14} /> Inspection Quality Pass
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Defect / Scrap Cost Ratio</span>
          <span className="kpi-value" style={{ color: 100 - kpis.qaPassRate > 5 ? '#EF4444' : '#F59E0B' }}>
            {100 - kpis.qaPassRate}%
          </span>
          <span className="kpi-change negative">
            <AlertOctagon size={14} /> Material Loss & Scrap
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-grid">
        {/* Inventory Assets by Category */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Inventory Capital Distribution by Material Type</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Asset Breakdown</span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={valuationByType} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D333F" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B21', borderColor: '#2D333F', color: '#FFFFFF', borderRadius: '6px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} THB`, 'Valuation']}
                />
                <Legend />
                <Bar dataKey="value" name="Valuation (THB)" radius={[4, 4, 0, 0]}>
                  {valuationByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Yield & Scrap Breakdown */}
        <div className="card">
          <div className="card-title">Quality Assurance Inspections Ratio</div>
          <div style={{ display: 'flex', flexDirection: 'column', height: '300px', justifyContent: 'space-around', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Factory size={40} style={{ color: '#FF7A00' }} />
              <div>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>{inspections.length} Total</p>
                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Evaluated Inspection Records</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {qaBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>
                      {item.count} items ({item.pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#13161C', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(item.count > 0 ? 5 : 0, item.pct)}%`,
                        height: '100%',
                        backgroundColor: item.color,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center' }}>
              Automated telemetry from Quality Inspection logs
            </p>
          </div>
        </div>
      </div>

      {/* Top 6 Valued Inventory Items Table */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Top Capital Tied-Up Inventory Items</span>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Ranked by Total Value</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Stock Quantity</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Share of Assets</th>
                <th>Stock Health</th>
              </tr>
            </thead>
            <tbody>
              {topValuedStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No inventory items registered.
                  </td>
                </tr>
              ) : (
                topValuedStocks.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: '#FF7A00' }}>{item.code}</td>
                    <td>{item.name}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '11px' }}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td>{item.cost.toLocaleString()} THB</td>
                    <td style={{ fontWeight: 700, color: '#22C55E' }}>{item.totalValue.toLocaleString()} THB</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', minWidth: '38px' }}>{item.sharePct.toFixed(1)}%</span>
                        <div style={{ width: '60px', height: '6px', backgroundColor: '#13161C', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.sharePct}%`, height: '100%', backgroundColor: '#FF7A00', borderRadius: '3px' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'NORMAL' ? 'badge-success' : item.status === 'LOW' ? 'badge-warning' : 'badge-danger'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
