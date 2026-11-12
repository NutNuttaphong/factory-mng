import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SalesOrder, Delivery, Product, Customer } from '../types';
import { Button } from '../components/shared/Button';
import { DataTable } from '../components/shared/Table';
import { Modal } from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';

interface SalesViewProps {
  salesOrders: SalesOrder[];
  deliveries: Delivery[];
  products: Product[];
  customers: Customer[];
  hasPermission: (p: string) => boolean;
  onCreateSO: (customerId: string, items: { productId: string; quantity: number; price: number }[]) => Promise<boolean> | boolean;
  onReserveSOStock: (so: SalesOrder) => Promise<void> | void;
  onDeliverSO: (so: SalesOrder) => Promise<void> | void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  salesOrders,
  deliveries,
  products,
  customers,
  hasPermission,
  onCreateSO,
  onReserveSOStock,
  onDeliverSO,
}) => {
  const { warning } = useToast();
  const [showCreateSOModal, setShowCreateSOModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [soFormItems, setSoFormItems] = useState<{ productId: string; quantity: number; price: number }[]>([
    { productId: '', quantity: 1, price: 0 },
  ]);

  const handleCreateSOSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      warning('Please select a customer');
      return;
    }
    const validItems = soFormItems.filter((it) => it.productId !== '');
    if (validItems.length === 0) {
      warning('Please add at least one product item');
      return;
    }
    setLoading(true);
    const success = await onCreateSO(
      selectedCustomerId,
      validItems.map((v) => ({ productId: v.productId, quantity: v.quantity, price: v.price }))
    );
    setLoading(false);
    if (success) {
      setShowCreateSOModal(false);
      setSelectedCustomerId('');
      setSoFormItems([{ productId: '', quantity: 1, price: 0 }]);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          Sales Orders (SO)
          {hasPermission('PRODUCT_CREATE') && ( // Sales agent
            <Button size="sm" onClick={() => setShowCreateSOModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Create Sales Order
            </Button>
          )}
        </div>

        <DataTable
          data={salesOrders}
          headers={['SO Code', 'Customer', 'Salesperson', 'Total Amount', 'Status', 'Actions']}
          searchPlaceholder="Search SO code, customer, or salesperson..."
          searchFilter={(so, q) =>
            so.code.toLowerCase().includes(q.toLowerCase()) ||
            (so.customer?.name || '').toLowerCase().includes(q.toLowerCase()) ||
            (so.salesperson?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'DRAFT', 'RESERVED', 'DELIVERED'],
              filterFn: (so, sel) => sel === 'ALL' || so.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(so) => (
            <tr key={so.id}>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{so.code}</td>
              <td>{so.customer?.name}</td>
              <td>{so.salesperson?.fullName}</td>
              <td>{so.totalAmount.toLocaleString()} THB</td>
              <td>
                <span
                  className={`badge ${
                    so.status === 'DELIVERED' ? 'badge-success' : so.status === 'RESERVED' ? 'badge-info' : 'badge-warning'
                  }`}
                >
                  {so.status}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {so.status === 'DRAFT' && (
                    <Button variant="secondary" size="sm" onClick={() => onReserveSOStock(so)}>
                      Check & Reserve Stock
                    </Button>
                  )}
                  {so.status === 'RESERVED' && (
                    <Button size="sm" onClick={() => onDeliverSO(so)}>
                      Dispatch Shipment
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Delivery logs */}
      <div className="card">
        <div className="card-title">Deliveries Dispatched Registry</div>
        <DataTable
          data={deliveries}
          headers={['Delivery No.', 'Linked SO', 'Customer Name', 'Shipment Agent', 'Date', 'Status']}
          searchPlaceholder="Search delivery no, linked SO, or customer..."
          searchFilter={(d, q) =>
            d.code.toLowerCase().includes(q.toLowerCase()) ||
            (d.salesOrder?.code || '').toLowerCase().includes(q.toLowerCase()) ||
            (d.salesOrder?.customer?.name || '').toLowerCase().includes(q.toLowerCase()) ||
            (d.shippedBy?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'DELIVERED'],
              filterFn: (d, sel) => sel === 'ALL' || d.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(d) => (
            <tr key={d.id}>
              <td style={{ fontWeight: 600 }}>{d.code}</td>
              <td style={{ color: '#FF7A00' }}>{d.salesOrder?.code}</td>
              <td>{d.salesOrder?.customer?.name}</td>
              <td>{d.shippedBy?.fullName}</td>
              <td>{d.deliveryDate}</td>
              <td>
                <span className="badge badge-success">{d.status}</span>
              </td>
            </tr>
          )}
        />
      </div>

      {/* 8. Modal: Create SO */}
      <Modal
        isOpen={showCreateSOModal}
        title="Create Sales Order"
        onClose={() => setShowCreateSOModal(false)}
        contentStyle={{ maxWidth: '680px' }}
      >
        <form onSubmit={handleCreateSOSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Customer</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {soFormItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: soFormItems.length > 1 ? '2.5fr 1fr 1fr 1.2fr 38px' : '2.5fr 1fr 1fr 1.2fr',
                  gap: '10px',
                  alignItems: 'flex-end',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #1F242D',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Product</label>
                  <select
                    className="form-control"
                    value={item.productId}
                    onChange={(e) => {
                      const newItems = [...soFormItems];
                      newItems[idx].productId = e.target.value;
                      const match = products.find((p) => p.id === e.target.value);
                      if (match) newItems[idx].price = match.price;
                      setSoFormItems(newItems);
                    }}
                    required
                  >
                    <option value="">Select product...</option>
                    {products
                      .filter((p) => p.type === 'FINISHED_GOOD')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} ({p.price.toLocaleString()} ฿)
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...soFormItems];
                      newItems[idx].quantity = Math.max(1, Number(e.target.value));
                      setSoFormItems(newItems);
                    }}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Unit Price</label>
                  <input
                    type="text"
                    className="form-control"
                    value={item.price ? `${item.price.toLocaleString()} ฿` : '-'}
                    readOnly
                    style={{ backgroundColor: '#13161C', color: '#9CA3AF' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Subtotal</label>
                  <input
                    type="text"
                    className="form-control"
                    value={
                      item.productId && item.price
                        ? `${(item.quantity * item.price).toLocaleString()} ฿`
                        : '-'
                    }
                    readOnly
                    style={{ backgroundColor: '#13161C', color: '#FF7A00', fontWeight: 600 }}
                  />
                </div>
                {soFormItems.length > 1 && (
                  <div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setSoFormItems(soFormItems.filter((_, i) => i !== idx))}
                      style={{ padding: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Grand Total Summary */}
            <div
              style={{
                backgroundColor: '#13161C',
                border: '1px solid #2D333F',
                borderRadius: '6px',
                padding: '12px 16px',
                marginTop: '12px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                Products count: <strong style={{ color: '#E5E7EB' }}>{soFormItems.filter((i) => i.productId).length}</strong>
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                Grand Total:{' '}
                <span style={{ color: '#FF7A00', fontSize: '17px', fontWeight: 700 }}>
                  {soFormItems
                    .reduce((sum, item) => sum + (item.productId ? item.quantity * item.price : 0), 0)
                    .toLocaleString()}{' '}
                  THB
                </span>
              </span>
            </div>

            <Button variant="secondary" size="sm" type="button" onClick={() => setSoFormItems([...soFormItems, { productId: '', quantity: 1, price: 0 }])}>
              + Add Product Item
            </Button>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowCreateSOModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Draft SO
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
