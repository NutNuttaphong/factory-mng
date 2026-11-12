import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BOM, ProductionPlan, WorkOrder, Product } from '../types';
import { Button } from '../components/shared/Button';
import { DataTable } from '../components/shared/Table';
import { Modal } from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';

interface ProductionViewProps {
  boms: BOM[];
  productionPlans: ProductionPlan[];
  workOrders: WorkOrder[];
  products: Product[];
  hasPermission: (p: string) => boolean;
  onCreatePlan: (productId: string, targetQuantity: number, startDate: string, endDate: string) => Promise<boolean> | boolean;
  onCreateWO: (productId: string, quantity: number, planId?: string, assignedToId?: string) => Promise<boolean> | boolean;
  onIssueWOMaterials: (wo: WorkOrder) => Promise<void> | void;
  onStartWOProduction: (woId: string) => Promise<void> | void;
  onReportYieldResult: (wo: WorkOrder, passQty: number, failQty: number) => Promise<boolean> | boolean;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  boms,
  productionPlans,
  workOrders,
  products,
  hasPermission,
  onCreatePlan,
  onCreateWO,
  onIssueWOMaterials,
  onStartWOProduction,
  onReportYieldResult,
}) => {
  const { warning } = useToast();
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showCreateWOModal, setShowCreateWOModal] = useState(false);
  const [showReportYieldModal, setShowReportYieldModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);

  // Forms states
  const [planForm, setPlanForm] = useState({
    productId: '',
    targetQuantity: 100,
    startDate: '',
    endDate: '',
  });

  const [woForm, setWoForm] = useState({
    productionPlanId: '',
    productId: '',
    quantity: 100,
    assignedToId: 'production@factory.com',
  });

  const handleCreatePlanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!planForm.productId || !planForm.startDate || !planForm.endDate) {
      warning('Please fill out all fields');
      return;
    }
    setLoading(true);
    const success = await onCreatePlan(planForm.productId, planForm.targetQuantity, planForm.startDate, planForm.endDate);
    setLoading(false);
    if (success) {
      setShowCreatePlanModal(false);
      setPlanForm({ productId: '', targetQuantity: 100, startDate: '', endDate: '' });
    }
  };

  const handleCreateWOSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!woForm.productId) {
      warning('Please select a product');
      return;
    }
    setLoading(true);
    const success = await onCreateWO(woForm.productId, woForm.quantity, woForm.productionPlanId || undefined, woForm.assignedToId);
    setLoading(false);
    if (success) {
      setShowCreateWOModal(false);
      setWoForm({ productionPlanId: '', productId: '', quantity: 100, assignedToId: 'production@factory.com' });
    }
  };

  const handleReportYieldSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWO) return;
    const fd = new FormData(e.currentTarget);
    const passQty = Number(fd.get('passQty'));
    const failQty = Number(fd.get('failQty'));

    setLoading(true);
    const success = await onReportYieldResult(selectedWO, passQty, failQty);
    setLoading(false);
    if (success) {
      setShowReportYieldModal(false);
      setSelectedWO(null);
    }
  };

  return (
    <div>
      {/* Production plans */}
      <div className="card">
        <div className="card-title">
          Production Schedules (Plans)
          {hasPermission('PRODUCTION_CREATE') && (
            <Button size="sm" onClick={() => setShowCreatePlanModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> New Plan
            </Button>
          )}
        </div>

        <DataTable
          data={productionPlans}
          headers={['Plan Code', 'Target Product', 'Target Qty', 'Start Date', 'End Date', 'Status']}
          searchPlaceholder="Search plan code or product..."
          searchFilter={(pl, q) =>
            pl.code.toLowerCase().includes(q.toLowerCase()) ||
            pl.product.code.toLowerCase().includes(q.toLowerCase()) ||
            pl.product.name.toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'ACTIVE', 'COMPLETED'],
              filterFn: (pl, sel) => sel === 'ALL' || pl.status === sel,
            },
          ]}
          pageSize={5}
          renderRow={(pl) => (
            <tr key={pl.id}>
              <td style={{ fontWeight: 600 }}>{pl.code}</td>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{pl.product.code}</td>
              <td>{pl.targetQuantity.toLocaleString()} Units</td>
              <td>{pl.startDate}</td>
              <td>{pl.endDate}</td>
              <td>
                <span className={`badge ${pl.status === 'ACTIVE' ? 'badge-info' : 'badge-success'}`}>{pl.status}</span>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Work Orders */}
      <div className="card">
        <div className="card-title">
          Work Orders Lifecycle (WO)
          {hasPermission('PRODUCTION_CREATE') && (
            <Button size="sm" onClick={() => setShowCreateWOModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Create Work Order
            </Button>
          )}
        </div>

        <DataTable
          data={workOrders}
          headers={['WO Code', 'Product', 'Target Qty', 'Assigned To', 'Status', 'Action Steps']}
          searchPlaceholder="Search WO code, product, or assigned operator..."
          searchFilter={(wo, q) =>
            wo.code.toLowerCase().includes(q.toLowerCase()) ||
            wo.product.name.toLowerCase().includes(q.toLowerCase()) ||
            wo.product.code.toLowerCase().includes(q.toLowerCase()) ||
            (wo.assignedTo?.fullName || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Status',
              options: ['ALL', 'DRAFT', 'PENDING_MATERIAL', 'MATERIAL_ISSUED', 'IN_PRODUCTION', 'PENDING_QA', 'COMPLETED'],
              filterFn: (wo, sel) => sel === 'ALL' || wo.status === sel,
            },
          ]}
          pageSize={8}
          renderRow={(wo) => (
            <tr key={wo.id}>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{wo.code}</td>
              <td>{wo.product.name}</td>
              <td style={{ fontWeight: 700 }}>{wo.quantity.toLocaleString()}</td>
              <td>{wo.assignedTo?.fullName}</td>
              <td>
                <span
                  className={`badge ${
                    wo.status === 'COMPLETED'
                      ? 'badge-success'
                      : wo.status === 'IN_PRODUCTION' || wo.status === 'MATERIAL_ISSUED'
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}
                >
                  {wo.status.replace('_', ' ')}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {wo.status === 'DRAFT' && (
                    <Button variant="secondary" size="sm" onClick={() => onIssueWOMaterials(wo)}>
                      Check & Issue BOM Stock
                    </Button>
                  )}
                  {wo.status === 'PENDING_MATERIAL' && (
                    <Button variant="danger" size="sm" onClick={() => onIssueWOMaterials(wo)}>
                      Recheck Raw Stock
                    </Button>
                  )}
                  {wo.status === 'MATERIAL_ISSUED' && (
                    <Button size="sm" onClick={() => onStartWOProduction(wo.id)}>
                      Start Production
                    </Button>
                  )}
                  {wo.status === 'IN_PRODUCTION' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedWO(wo);
                        setShowReportYieldModal(true);
                      }}
                    >
                      Report Yield Result
                    </Button>
                  )}
                  {wo.status === 'PENDING_QA' && <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>Awaiting QA Inspection</span>}
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* BOM configs */}
      <div className="card">
        <div className="card-title">Bill of Materials Configuration (BOM)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {boms.map((bom) => (
            <div key={bom.id} style={{ backgroundColor: '#1F242D', padding: '20px', borderRadius: '8px', border: '1px solid #2D333F' }}>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#FF7A00', marginBottom: '12px' }}>
                {bom.code} ({bom.product.name})
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bom.items.map((it) => (
                  <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>🔩 {it.product.name} ({it.product.code})</span>
                    <span style={{ fontWeight: 600 }}>
                      {it.quantityNeeded} {it.product.unit?.name} per unit
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Modal: Create Plan */}
      <Modal isOpen={showCreatePlanModal} title="Create Production Plan" onClose={() => setShowCreatePlanModal(false)}>
        <form onSubmit={handleCreatePlanSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Product to Manufacture</label>
              <select
                className="form-control"
                value={planForm.productId}
                onChange={(e) => setPlanForm({ ...planForm, productId: e.target.value })}
                required
              >
                <option value="">Select product...</option>
                {products
                  .filter((p) => p.type === 'FINISHED_GOOD')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Quantity</label>
              <input
                type="number"
                className="form-control"
                value={planForm.targetQuantity}
                onChange={(e) => setPlanForm({ ...planForm, targetQuantity: Number(e.target.value) })}
                min="1"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={planForm.startDate}
                  onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={planForm.endDate}
                  onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowCreatePlanModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal: Create WO */}
      <Modal isOpen={showCreateWOModal} title="Create Work Order (WO)" onClose={() => setShowCreateWOModal(false)}>
        <form onSubmit={handleCreateWOSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Link to Production Plan</label>
              <select
                className="form-control"
                value={woForm.productionPlanId}
                onChange={(e) => {
                  const plId = e.target.value;
                  const matchedPlan = productionPlans.find((p) => p.id === plId);
                  setWoForm({
                    ...woForm,
                    productionPlanId: plId,
                    productId: matchedPlan ? matchedPlan.product.id : '',
                    quantity: matchedPlan ? matchedPlan.targetQuantity : 100,
                  });
                }}
              >
                <option value="">Standalone Work Order (No Plan Link)</option>
                {productionPlans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.code} - {pl.product.name} ({pl.targetQuantity} units)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Product to Manufacture</label>
              <select
                className="form-control"
                value={woForm.productId}
                onChange={(e) => setWoForm({ ...woForm, productId: e.target.value })}
                required
              >
                <option value="">Select product...</option>
                {products
                  .filter((p) => p.type === 'FINISHED_GOOD')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Quantity</label>
              <input
                type="number"
                className="form-control"
                value={woForm.quantity}
                onChange={(e) => setWoForm({ ...woForm, quantity: Number(e.target.value) })}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign Operator</label>
              <select
                className="form-control"
                value={woForm.assignedToId}
                onChange={(e) => setWoForm({ ...woForm, assignedToId: e.target.value })}
                required
              >
                <option value="production@factory.com">Kitti Production</option>
                <option value="superadmin@factory.com">Nuttaphong SuperAdmin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowCreateWOModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Work Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Report Yield Result */}
      <Modal isOpen={showReportYieldModal} title={`Report Production Yield (${selectedWO?.code || ''})`} onClose={() => setShowReportYieldModal(false)}>
        <form onSubmit={handleReportYieldSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Quantity Produced (Yield)</label>
              <input type="number" className="form-control" name="passQty" defaultValue={selectedWO?.quantity || 100} required />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Defective (Scrap)</label>
              <input type="number" className="form-control" name="failQty" defaultValue={0} required />
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowReportYieldModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Submit Yield to QA
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
