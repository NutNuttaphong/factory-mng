import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Product, PurchaseRequest, PurchaseOrder, GoodsReceipt } from '../types';
import { Button } from '../components/shared/Button';
import { DataTable } from '../components/shared/Table';
import { Modal } from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';

interface ProcurementViewProps {
  products: Product[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  hasPermission: (p: string) => boolean;
  onCreatePR: (items: { productId: string; quantity: number; estimatedPrice: number }[]) => Promise<boolean> | boolean;
  onSubmitPR: (prId: string) => Promise<void> | void;
  onPRDecision: (prId: string, decision: 'APPROVE' | 'REJECT', comment: string) => Promise<boolean> | boolean;
  onCreateReceipt: (po: PurchaseOrder) => Promise<void> | void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  products,
  purchaseRequests,
  purchaseOrders,
  goodsReceipts,
  hasPermission,
  onCreatePR,
  onSubmitPR,
  onPRDecision,
  onCreateReceipt,
}) => {
  const { warning } = useToast();
  const [showCreatePRModal, setShowCreatePRModal] = useState(false);
  const [showApprovePRModal, setShowApprovePRModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [prApprovalComment, setPrApprovalComment] = useState('');
  const [loading, setLoading] = useState(false);

  // PR Form items
  const [prFormItems, setPrFormItems] = useState<{ productId: string; quantity: number; estimatedPrice: number }[]>([
    { productId: '', quantity: 10, estimatedPrice: 0 },
  ]);

  const handleCreatePRSubmit = async () => {
    // Filter empty items
    const validItems = prFormItems.filter((it) => it.productId !== '');
    if (validItems.length === 0) {
      warning('Please add at least one material item');
      return;
    }
    setLoading(true);
    const success = await onCreatePR(
      validItems.map((v) => ({
        productId: v.productId,
        quantity: v.quantity,
        estimatedPrice: v.estimatedPrice,
      }))
    );
    setLoading(false);
    if (success) {
      setPrFormItems([{ productId: '', quantity: 10, estimatedPrice: 0 }]);
      setShowCreatePRModal(false);
    }
  };

  const handlePRDecisionSubmit = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedPR) return;
    setLoading(true);
    const success = await onPRDecision(selectedPR.id, decision, prApprovalComment);
    setLoading(false);
    if (success) {
      setShowApprovePRModal(false);
      setSelectedPR(null);
      setPrApprovalComment('');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          Purchase Requests (PR)
          {hasPermission('PURCHASE_CREATE') && (
            <Button size="sm" onClick={() => setShowCreatePRModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> New Request
            </Button>
          )}
        </div>

        <DataTable
          data={purchaseRequests}
          headers={['PR Code', 'Requester', 'Total Value', 'Date', 'Status', 'Actions']}
          searchPlaceholder="Search PR code or requester..."
          searchFilter={(pr, q) =>
            pr.code.toLowerCase().includes(q.toLowerCase()) ||
            (pr.requester?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
              filterFn: (pr, sel) => sel === 'ALL' || pr.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(pr) => (
            <tr key={pr.id}>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{pr.code}</td>
              <td>{pr.requester?.fullName}</td>
              <td>{pr.totalAmount.toLocaleString()} THB</td>
              <td>{pr.createdAt}</td>
              <td>
                <span
                  className={`badge ${
                    pr.status === 'APPROVED'
                      ? 'badge-success'
                      : pr.status === 'PENDING_APPROVAL'
                      ? 'badge-warning'
                      : pr.status === 'REJECTED'
                      ? 'badge-danger'
                      : 'badge-info'
                  }`}
                >
                  {pr.status.replace('_', ' ')}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {pr.status === 'DRAFT' && hasPermission('PURCHASE_CREATE') && (
                    <Button variant="secondary" size="sm" onClick={() => onSubmitPR(pr.id)}>
                      Submit Approval
                    </Button>
                  )}
                  {pr.status === 'PENDING_APPROVAL' && hasPermission('PURCHASE_APPROVE') && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPR(pr);
                        setShowApprovePRModal(true);
                      }}
                    >
                      Approve / Reject
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Purchase Orders (PO) */}
      <div className="card">
        <div className="card-title">Approved Purchase Orders (PO)</div>
        <DataTable
          data={purchaseOrders}
          headers={['PO Code', 'Supplier', 'Buyer', 'Total Amount', 'Status', 'Receiving']}
          searchPlaceholder="Search PO code, supplier, or buyer..."
          searchFilter={(po, q) =>
            po.code.toLowerCase().includes(q.toLowerCase()) ||
            (po.supplier?.name || '').toLowerCase().includes(q.toLowerCase()) ||
            (po.buyer?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED'],
              filterFn: (po, sel) => sel === 'ALL' || po.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(po) => (
            <tr key={po.id}>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{po.code}</td>
              <td>{po.supplier?.name}</td>
              <td>{po.buyer?.fullName}</td>
              <td>{po.totalAmount.toLocaleString()} THB</td>
              <td>
                <span className="badge badge-success">{po.status}</span>
              </td>
              <td>
                <Button variant="secondary" size="sm" onClick={() => onCreateReceipt(po)}>
                  Receive Shipment
                </Button>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Goods Receipts (GR) */}
      <div className="card">
        <div className="card-title">Goods Receipts Registry (GR)</div>
        <DataTable
          data={goodsReceipts}
          headers={['Receipt Code', 'Linked PO', 'Supplier', 'Received By', 'Status']}
          searchPlaceholder="Search receipt code, linked PO, or supplier..."
          searchFilter={(gr, q) =>
            gr.code.toLowerCase().includes(q.toLowerCase()) ||
            (gr.purchaseOrder?.code || '').toLowerCase().includes(q.toLowerCase()) ||
            (gr.purchaseOrder?.supplier?.name || '').toLowerCase().includes(q.toLowerCase()) ||
            (gr.receivedBy?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'PENDING_QA', 'QA_PASSED', 'STOCKED', 'REJECTED'],
              filterFn: (gr, sel) => sel === 'ALL' || gr.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(gr) => (
            <tr key={gr.id}>
              <td style={{ fontWeight: 600 }}>{gr.code}</td>
              <td style={{ color: '#FF7A00' }}>{gr.purchaseOrder?.code}</td>
              <td>{gr.purchaseOrder?.supplier?.name}</td>
              <td>{gr.receivedBy?.fullName}</td>
              <td>
                <span
                  className={`badge ${
                    gr.status === 'QA_PASSED' || gr.status === 'STOCKED'
                      ? 'badge-success'
                      : gr.status === 'PENDING_QA'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                >
                  {gr.status.replace('_', ' ')}
                </span>
              </td>
            </tr>
          )}
        />
      </div>

      {/* 1. Modal: Create PR */}
      <Modal
        isOpen={showCreatePRModal}
        title="Create Purchase Request (PR)"
        onClose={() => setShowCreatePRModal(false)}
        contentStyle={{ maxWidth: '680px' }}
      >
        <div className="modal-body">
          {prFormItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: prFormItems.length > 1 ? '2.5fr 1fr 1fr 1.2fr 38px' : '2.5fr 1fr 1fr 1.2fr',
                gap: '10px',
                alignItems: 'flex-end',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #1F242D',
              }}
            >
              <div>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Material Item</label>
                <select
                  className="form-control"
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...prFormItems];
                    newItems[idx].productId = e.target.value;
                    const match = products.find((p) => p.id === e.target.value);
                    if (match) newItems[idx].estimatedPrice = match.cost;
                    setPrFormItems(newItems);
                  }}
                >
                  <option value="">Select Material...</option>
                  {products
                    .filter((p) => p.type !== 'FINISHED_GOOD')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Qty</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...prFormItems];
                    newItems[idx].quantity = Math.max(1, Number(e.target.value));
                    setPrFormItems(newItems);
                  }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Unit Cost</label>
                <input
                  type="text"
                  className="form-control"
                  value={item.estimatedPrice ? `${item.estimatedPrice.toLocaleString()} ฿` : '-'}
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
                    item.productId && item.estimatedPrice
                      ? `${(item.quantity * item.estimatedPrice).toLocaleString()} ฿`
                      : '-'
                  }
                  readOnly
                  style={{ backgroundColor: '#13161C', color: '#FF7A00', fontWeight: 600 }}
                />
              </div>
              {prFormItems.length > 1 && (
                <div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setPrFormItems(prFormItems.filter((_, i) => i !== idx))}
                    style={{ padding: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Grand total summary banner */}
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
              Materials count: <strong style={{ color: '#E5E7EB' }}>{prFormItems.filter((i) => i.productId).length}</strong>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              Grand Total:{' '}
              <span style={{ color: '#FF7A00', fontSize: '17px', fontWeight: 700 }}>
                {prFormItems
                  .reduce((sum, item) => sum + (item.productId ? item.quantity * item.estimatedPrice : 0), 0)
                  .toLocaleString()}{' '}
                THB
              </span>
            </span>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setPrFormItems([...prFormItems, { productId: '', quantity: 10, estimatedPrice: 0 }])}>
            + Add Material Item
          </Button>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowCreatePRModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreatePRSubmit} loading={loading}>
            Create Draft PR
          </Button>
        </div>
      </Modal>

      {/* 2. Modal: Approve PR */}
      <Modal isOpen={showApprovePRModal} title={`Approve Purchase Request ${selectedPR?.code || ''}`} onClose={() => setShowApprovePRModal(false)}>
        <div className="modal-body">
          {selectedPR && (
            <p style={{ marginBottom: '16px', fontSize: '14px' }}>
              Requester: <span style={{ fontWeight: 600 }}>{selectedPR.requester?.fullName}</span>
              <br />
              Total Amount:{' '}
              <span style={{ fontWeight: 700, color: '#FF7A00' }}>{selectedPR.totalAmount.toLocaleString()} THB</span>
            </p>
          )}

          <div className="form-group">
            <label className="form-label">Workflow Decision Comments</label>
            <textarea
              className="form-control"
              rows={3}
              value={prApprovalComment}
              onChange={(e) => setPrApprovalComment(e.target.value)}
              placeholder="Enter approval note or rejection reasons..."
            />
          </div>
        </div>
        <div className="modal-footer" style={{ gap: '12px' }}>
          <Button variant="danger" onClick={() => handlePRDecisionSubmit('REJECT')} loading={loading}>
            Reject
          </Button>
          <Button onClick={() => handlePRDecisionSubmit('APPROVE')} loading={loading}>
            Approve
          </Button>
        </div>
      </Modal>
    </div>
  );
};
