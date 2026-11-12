import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { QualityInspection, GoodsReceipt, WorkOrder } from '../types';
import { Button } from '../components/shared/Button';
import { DataTable } from '../components/shared/Table';
import { Modal } from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';

interface QualityViewProps {
  inspections: QualityInspection[];
  goodsReceipts: GoodsReceipt[];
  workOrders: WorkOrder[];
  hasPermission: (p: string) => boolean;
  onCreateInspection: (payload: any) => Promise<boolean> | boolean;
}

export const QualityView: React.FC<QualityViewProps> = ({
  inspections,
  goodsReceipts,
  workOrders,
  hasPermission,
  onCreateInspection,
}) => {
  const { warning } = useToast();
  const [showCreateInspectionModal, setShowCreateInspectionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [inspectForm, setInspectForm] = useState({
    workOrderId: '',
    goodsReceiptId: '',
    productId: '',
    batchNo: 'BAT-001',
    color: 'Normal',
    weight: 100,
    size: 10,
    temperature: 25,
    status: 'PASS' as 'PASS' | 'FAIL' | 'REWORK',
    comment: '',
  });

  const handleCreateInspectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inspectForm.workOrderId && !inspectForm.goodsReceiptId) {
      warning('Please choose an inspection target reference');
      return;
    }
    setLoading(true);
    const success = await onCreateInspection(inspectForm);
    setLoading(false);
    if (success) {
      setShowCreateInspectionModal(false);
      setInspectForm({
        workOrderId: '',
        goodsReceiptId: '',
        productId: '',
        batchNo: 'BAT-001',
        color: 'Normal',
        weight: 100,
        size: 10,
        temperature: 25,
        status: 'PASS',
        comment: '',
      });
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          QA Inspections Registry
          {hasPermission('REPORT_VIEW') && ( // QA role has access to view reports
            <Button size="sm" onClick={() => setShowCreateInspectionModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> New Inspection
            </Button>
          )}
        </div>

        <DataTable
          data={inspections}
          headers={['QA Code', 'Product', 'Batch / Lot No', 'Inspector', 'Metrics (W/S/C/T)', 'QA Result', 'Comment']}
          searchPlaceholder="Search QA code, product, batch, or inspector..."
          searchFilter={(ins, q) =>
            ins.code.toLowerCase().includes(q.toLowerCase()) ||
            ins.product.code.toLowerCase().includes(q.toLowerCase()) ||
            ins.product.name.toLowerCase().includes(q.toLowerCase()) ||
            (ins.batchNo || '').toLowerCase().includes(q.toLowerCase()) ||
            (ins.inspector?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Result',
              options: ['ALL', 'PASS', 'FAIL', 'REWORK'],
              filterFn: (ins, sel) => sel === 'ALL' || ins.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(ins) => (
            <tr key={ins.id}>
              <td style={{ fontWeight: 600 }}>{ins.code}</td>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{ins.product.code}</td>
              <td>{ins.batchNo}</td>
              <td>{ins.inspector?.fullName}</td>
              <td style={{ fontSize: '12px', color: '#9CA3AF' }}>
                W: {ins.weight || '-'}, S: {ins.size || '-'}, C: {ins.color || '-'}, T: {ins.temperature ? `${ins.temperature}°C` : '-'}
              </td>
              <td>
                <span className={`badge ${ins.status === 'PASS' ? 'badge-success' : ins.status === 'FAIL' ? 'badge-danger' : 'badge-warning'}`}>
                  {ins.status}
                </span>
              </td>
              <td>{ins.comment}</td>
            </tr>
          )}
        />
      </div>

      {/* 7. Modal: Create QA Inspection */}
      <Modal isOpen={showCreateInspectionModal} title="Record QA Inspection" onClose={() => setShowCreateInspectionModal(false)}>
        <form onSubmit={handleCreateInspectionSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Inspection Target Reference</label>
              <select
                className="form-control"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('wo-')) {
                    const targetWO = workOrders.find((w) => w.id === val.replace('wo-', ''))!;
                    setInspectForm({
                      ...inspectForm,
                      workOrderId: targetWO.id,
                      goodsReceiptId: '',
                      productId: targetWO.product.id,
                    });
                  } else if (val.startsWith('gr-')) {
                    const targetGR = goodsReceipts.find((g) => g.id === val.replace('gr-', ''))!;
                    setInspectForm({
                      ...inspectForm,
                      goodsReceiptId: targetGR.id,
                      workOrderId: '',
                      productId: targetGR.items[0]?.product.id || '',
                    });
                  }
                }}
                required
              >
                <option value="">Choose item waiting for QA...</option>
                <optgroup label="Pending Work Orders">
                  {workOrders
                    .filter((w) => w.status === 'PENDING_QA')
                    .map((w) => (
                      <option key={w.id} value={`wo-${w.id}`}>
                        {w.code} - Finished Good Product
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Pending Goods Receipts">
                  {goodsReceipts
                    .filter((g) => g.status === 'PENDING_QA')
                    .map((g) => (
                      <option key={g.id} value={`gr-${g.id}`}>
                        {g.code} - Procurement Shipment
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Lot / Batch No.</label>
                <input
                  type="text"
                  className="form-control"
                  value={inspectForm.batchNo}
                  onChange={(e) => setInspectForm({ ...inspectForm, batchNo: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color Metric</label>
                <input
                  type="text"
                  className="form-control"
                  value={inspectForm.color}
                  onChange={(e) => setInspectForm({ ...inspectForm, color: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Weight Checked</label>
                <input
                  type="number"
                  className="form-control"
                  value={inspectForm.weight}
                  onChange={(e) => setInspectForm({ ...inspectForm, weight: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Size Checked</label>
                <input
                  type="number"
                  className="form-control"
                  value={inspectForm.size}
                  onChange={(e) => setInspectForm({ ...inspectForm, size: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Temp (°C)</label>
                <input
                  type="number"
                  className="form-control"
                  value={inspectForm.temperature}
                  onChange={(e) => setInspectForm({ ...inspectForm, temperature: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">QA Inspection Decision</label>
              <select
                className="form-control"
                value={inspectForm.status}
                onChange={(e) => setInspectForm({ ...inspectForm, status: e.target.value as any })}
              >
                <option value="PASS">✓ PASS (Proceed to Stock In)</option>
                <option value="FAIL">✗ FAIL (Scrap / Return to Supplier)</option>
                <option value="REWORK">⚠️ REWORK (Flag for Production Adjust)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">QC Inspector Comments</label>
              <textarea
                className="form-control"
                rows={2}
                value={inspectForm.comment}
                onChange={(e) => setInspectForm({ ...inspectForm, comment: e.target.value })}
                placeholder="Enter inspection feedback..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowCreateInspectionModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Publish QA Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
