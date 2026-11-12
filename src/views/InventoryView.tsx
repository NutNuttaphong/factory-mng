import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Stock, StockMovement, Warehouse, Product } from '../types';
import { Button } from '../components/shared/Button';
import { DataTable } from '../components/shared/Table';
import { Modal } from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';

interface InventoryViewProps {
  stocks: Stock[];
  movements: StockMovement[];
  warehouses: Warehouse[];
  products: Product[];
  hasPermission: (p: string) => boolean;
  onAdjustStock: (productId: string, warehouseId: string, quantity: number) => Promise<boolean> | boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stocks,
  movements,
  warehouses,
  products,
  hasPermission,
  onAdjustStock,
}) => {
  const { warning } = useToast();
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [adjustStockForm, setAdjustStockForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: 0,
  });

  const handleAdjustStockSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustStockForm.productId || !adjustStockForm.warehouseId) {
      warning('Please fill out all fields');
      return;
    }
    setLoading(true);
    const success = await onAdjustStock(adjustStockForm.productId, adjustStockForm.warehouseId, adjustStockForm.quantity);
    setLoading(false);
    if (success) {
      setShowAdjustStockModal(false);
      setAdjustStockForm({ productId: '', warehouseId: '', quantity: 0 });
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          Stock Overview
          {hasPermission('STOCK_ADJUST') && (
            <Button size="sm" onClick={() => setShowAdjustStockModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Adjust Stock
            </Button>
          )}
        </div>

        <DataTable
          data={stocks}
          headers={['Product Code', 'Product Name', 'Warehouse', 'Stock Quantity', 'Minimum Stock', 'Status']}
          searchPlaceholder="Search product code, name, or warehouse..."
          searchFilter={(st, q) =>
            st.product.code.toLowerCase().includes(q.toLowerCase()) ||
            st.product.name.toLowerCase().includes(q.toLowerCase()) ||
            st.warehouse.code.toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'NORMAL', 'LOW', 'OUT'],
              filterFn: (st, sel) => sel === 'ALL' || st.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(st) => (
            <tr key={st.id}>
              <td style={{ fontWeight: 600 }}>{st.product.code}</td>
              <td>{st.product.name}</td>
              <td>{st.warehouse.code}</td>
              <td style={{ fontWeight: 700 }}>
                {st.quantity.toLocaleString()} {st.product.unit?.name}
              </td>
              <td>{st.product.minimumStock}</td>
              <td>
                <span
                  className={`badge ${
                    st.status === 'NORMAL' ? 'badge-success' : st.status === 'LOW' ? 'badge-warning' : 'badge-danger'
                  }`}
                >
                  {st.status}
                </span>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Movements history */}
      <div className="card">
        <div className="card-title">Stock Transaction Movements (Audit Ledger)</div>
        <DataTable
          data={movements}
          headers={['Time', 'Type', 'Product', 'From WH', 'To WH', 'Qty', 'Reference', 'Operator']}
          searchPlaceholder="Search movements by product, ref, or operator..."
          searchFilter={(m, q) =>
            m.product.code.toLowerCase().includes(q.toLowerCase()) ||
            (m.referenceType || '').toLowerCase().includes(q.toLowerCase()) ||
            (m.user?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Type',
              options: ['ALL', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'TRANSFER'],
              filterFn: (m, sel) => sel === 'ALL' || m.type === sel,
            },
          ]}
          pageSize={8}
          emptyMessage="No stock movement records found."
          renderRow={(m) => (
            <tr key={m.id}>
              <td>{m.createdAt}</td>
              <td>
                <span
                  className={`badge ${
                    m.type === 'STOCK_IN' ? 'badge-success' : m.type === 'STOCK_OUT' ? 'badge-danger' : 'badge-info'
                  }`}
                >
                  {m.type}
                </span>
              </td>
              <td style={{ fontWeight: 600 }}>{m.product.code}</td>
              <td>{m.fromWarehouse?.code || '-'}</td>
              <td>{m.toWarehouse?.code || '-'}</td>
              <td style={{ fontWeight: 700 }}>{m.quantity.toLocaleString()}</td>
              <td>{m.referenceType || '-'}</td>
              <td>{m.user?.fullName}</td>
            </tr>
          )}
        />
      </div>

      {/* 3. Modal: Adjust Stock */}
      <Modal isOpen={showAdjustStockModal} title="Manual Stock Adjustment" onClose={() => setShowAdjustStockModal(false)}>
        <form onSubmit={handleAdjustStockSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Product</label>
              <select
                className="form-control"
                value={adjustStockForm.productId}
                onChange={(e) => setAdjustStockForm({ ...adjustStockForm, productId: e.target.value })}
                required
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Warehouse</label>
              <select
                className="form-control"
                value={adjustStockForm.warehouseId}
                onChange={(e) => setAdjustStockForm({ ...adjustStockForm, warehouseId: e.target.value })}
                required
              >
                <option value="">Select Warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Absolute Quantity</label>
              <input
                type="number"
                className="form-control"
                value={adjustStockForm.quantity}
                onChange={(e) => setAdjustStockForm({ ...adjustStockForm, quantity: Number(e.target.value) })}
                min="0"
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowAdjustStockModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes (Logs Audit)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
