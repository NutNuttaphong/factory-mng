export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category?: Category;
  type: 'RAW_MATERIAL' | 'PACKAGING' | 'SEMI_FINISHED' | 'FINISHED_GOOD';
  unit?: Unit;
  cost: number;
  price: number;
  minimumStock: number;
  maximumStock: number;
  warehouse?: Warehouse;
  status: string;
}

export interface Stock {
  id: string;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  status: 'NORMAL' | 'LOW' | 'OUT';
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  product: Product;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  user: { fullName: string };
  createdAt: string;
}

export interface BOMItem {
  id: string;
  product: Product;
  quantityNeeded: number;
}

export interface BOM {
  id: string;
  code: string;
  product: Product;
  description?: string;
  items: BOMItem[];
  isActive: boolean;
}

export interface PurchaseRequestItem {
  id: string;
  product: Product;
  quantity: number;
  estimatedPrice: number;
  totalPrice: number;
}

export interface PurchaseRequest {
  id: string;
  code: string;
  requester: { id: string; fullName: string };
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  totalAmount: number;
  items: PurchaseRequestItem[];
  comment?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplier: Supplier;
  buyer: { fullName: string };
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  totalAmount: number;
  items: PurchaseOrderItem[];
  comment?: string;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  product: Product;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
}

export interface GoodsReceipt {
  id: string;
  code: string;
  purchaseOrder: PurchaseOrder;
  receivedBy: { fullName: string };
  status: 'PENDING_QA' | 'QA_PASSED' | 'QA_FAILED' | 'STOCKED';
  items: GoodsReceiptItem[];
  createdAt: string;
}

export interface ProductionPlan {
  id: string;
  code: string;
  product: Product;
  targetQuantity: number;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  productionPlan?: ProductionPlan;
  product: Product;
  quantity: number;
  status: 'DRAFT' | 'PENDING_MATERIAL' | 'MATERIAL_ISSUED' | 'IN_PRODUCTION' | 'PENDING_QA' | 'COMPLETED' | 'CANCELLED';
  assignedTo: { id: string; fullName: string };
  createdAt: string;
}

export interface QualityInspection {
  id: string;
  code: string;
  product: Product;
  workOrder?: WorkOrder;
  goodsReceipt?: GoodsReceipt;
  batchNo?: string;
  inspector: { fullName: string };
  weight?: number;
  size?: number;
  color?: string;
  temperature?: number;
  defectDetails?: string;
  status: 'PASS' | 'FAIL' | 'REWORK';
  comment?: string;
  createdAt: string;
}

export interface QualityDefect {
  id: string;
  inspection: QualityInspection;
  defectType: string;
  severity: number;
  description?: string;
  createdAt: string;
}

export interface SalesOrderItem {
  id: string;
  product: Product;
  quantity: number;
  quantityReserved: number;
  price: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  code: string;
  customer: Customer;
  salesperson: { fullName: string };
  status: 'DRAFT' | 'PENDING' | 'RESERVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  items: SalesOrderItem[];
  notes?: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  code: string;
  salesOrder: SalesOrder;
  shippedBy: { fullName: string };
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
  deliveryDate?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userEmail?: string;
  action: string;
  entityName: string;
  entityId: string;
  beforeState?: string;
  afterState?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  recipientRole?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface DashboardKPIs {
  totalSales: number;
  totalPurchasing: number;
  netMargin: number;
  activeWOs: number;
  lowStockItems: number;
  qaPassRate: number;
}

export interface ProductionBreakdown {
  draft: number;
  pendingMaterial: number;
  materialIssued: number;
  inProduction: number;
  pendingQA: number;
  completed: number;
}

export interface DashboardRecentLog {
  id: string;
  userEmail: string;
  action: string;
  entityName: string;
  createdAt: string;
}

export interface SalesAndCostsChartItem {
  month: string;
  Sales?: number;
  Costs?: number;
  sales?: number;
  costs?: number;
}
