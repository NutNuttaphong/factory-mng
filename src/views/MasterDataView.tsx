import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Product, Category, Unit, Warehouse } from '../types';
import { Button } from '../components/shared/Button';
import { DataTable } from '../components/shared/Table';
import { Modal } from '../components/shared/Modal';

interface MasterDataViewProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  warehouses: Warehouse[];
  hasPermission: (p: string) => boolean;
  onCreateProduct: (payload: any) => Promise<boolean> | boolean;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  products,
  categories,
  units,
  warehouses,
  hasPermission,
  onCreateProduct,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: fd.get('code') as string,
      name: fd.get('name') as string,
      categoryId: fd.get('categoryId') as string,
      type: fd.get('type') as any,
      unitId: fd.get('unitId') as string,
      cost: Number(fd.get('cost')),
      price: Number(fd.get('price')),
      minimumStock: Number(fd.get('minimumStock')),
      maximumStock: Number(fd.get('maximumStock')),
      warehouseId: (fd.get('warehouseId') as string) || undefined,
    };

    const success = await onCreateProduct(payload);
    setLoading(false);
    if (success) {
      setShowCreateModal(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          Catalog Inventory Masters
          {hasPermission('PRODUCT_CREATE') && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Add Product
            </Button>
          )}
        </div>

        <DataTable
          data={products}
          headers={['Product Code', 'Product Name', 'Type', 'Category', 'Cost', 'Selling Price', 'Min Stock', 'Status']}
          searchPlaceholder="Search product code, name, category..."
          searchFilter={(prod, q) =>
            prod.code.toLowerCase().includes(q.toLowerCase()) ||
            prod.name.toLowerCase().includes(q.toLowerCase()) ||
            (prod.category?.name || '').toLowerCase().includes(q.toLowerCase())
          }
          filterOptions={[
            {
              label: 'Type',
              options: ['ALL', 'RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD'],
              filterFn: (prod, sel) => sel === 'ALL' || prod.type === sel,
            },
          ]}
          pageSize={8}
          renderRow={(prod) => (
            <tr key={prod.id}>
              <td style={{ fontWeight: 600, color: '#FF7A00' }}>{prod.code}</td>
              <td>{prod.name}</td>
              <td>
                <span className="badge badge-info">{prod.type.replace('_', ' ')}</span>
              </td>
              <td>{prod.category?.name}</td>
              <td>{prod.cost} THB</td>
              <td>{prod.price > 0 ? `${prod.price} THB` : '-'}</td>
              <td>
                {prod.minimumStock} {prod.unit?.name}
              </td>
              <td>
                <span className={`badge ${prod.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{prod.status}</span>
              </td>
            </tr>
          )}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-title">Warehouses & Storages</div>
          <DataTable
            data={warehouses}
            headers={['WH Code', 'WH Name', 'Location']}
            searchPlaceholder="Search warehouse code, name, or location..."
            searchFilter={(w, q) =>
              w.code.toLowerCase().includes(q.toLowerCase()) ||
              w.name.toLowerCase().includes(q.toLowerCase()) ||
              (w.location || '').toLowerCase().includes(q.toLowerCase())
            }
            pageSize={5}
            renderRow={(w) => (
              <tr key={w.id}>
                <td style={{ fontWeight: 600 }}>{w.code}</td>
                <td>{w.name}</td>
                <td>{w.location || '-'}</td>
              </tr>
            )}
          />
        </div>

        <div className="card">
          <div className="card-title">Registered Suppliers & Customers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#1F242D', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                Supplier (Materials)
              </span>
              <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>ABC Manufacturing</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Contact: John | john@abc.com</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1F242D', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                Customer (Buyers)
              </span>
              <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>Retail Group Inc</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Contact: Jane | jane@retail.com</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateModal} title="Add New Product Master" onClose={() => setShowCreateModal(false)} contentStyle={{ maxWidth: '500px' }}>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Product Name</label>
              <input type="text" name="name" className="form-control" placeholder="e.g. Copper Wire" required />
            </div>
            <div className="form-group">
              <label className="form-label">Product Code</label>
              <input type="text" name="code" className="form-control" placeholder="e.g. RM-COPPER" required />
            </div>
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <select name="type" className="form-control" required>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="PACKAGING">Packaging</option>
                <option value="SEMI_FINISHED">Semi Finished Good</option>
                <option value="FINISHED_GOOD">Finished Good</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="categoryId" className="form-control" required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select name="unitId" className="form-control" required>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost (THB)</label>
              <input type="number" name="cost" className="form-control" defaultValue="0" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (THB)</label>
              <input type="number" name="price" className="form-control" defaultValue="0" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock</label>
              <input type="number" name="minimumStock" className="form-control" defaultValue="10" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Max Stock</label>
              <input type="number" name="maximumStock" className="form-control" defaultValue="10000" min="0" required />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Warehouse Store</label>
              <select name="warehouseId" className="form-control">
                <option value="">No Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
