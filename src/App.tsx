import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Factory,
  Truck,
  TrendingUp,
  Settings,
  Bell,
  AlertTriangle,
  Activity,
  LogOut,
  Package,
  Menu
} from 'lucide-react';
import api from './services/api';
import { useToast } from './components/shared/Toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Product,
  Stock,
  StockMovement,
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  ProductionPlan,
  WorkOrder,
  QualityInspection,
  SalesOrder,
  Delivery,
  AuditLog,
  SystemNotification,
  Category,
  Unit,
  Supplier,
  Customer,
  Warehouse,
  BOM,
  DashboardKPIs,
  ProductionBreakdown,
  DashboardRecentLog,
  SalesAndCostsChartItem
} from './types';

// Import Views
import { DashboardView } from './views/DashboardView';
import { MasterDataView } from './views/MasterDataView';
import { ProcurementView } from './views/ProcurementView';
import { InventoryView } from './views/InventoryView';
import { ProductionView } from './views/ProductionView';
import { QualityView } from './views/QualityView';
import { SalesView } from './views/SalesView';
import { ReportsView } from './views/ReportsView';
import { AdminView } from './views/AdminView';

// Reusable Shared components
import { Button } from './components/shared/Button';
import { Modal } from './components/shared/Modal';

// Preset credentials for easy testing
const MOCK_CREDENTIALS = [
  { email: 'superadmin@factory.com', role: 'Super Admin', desc: 'Manage everything & approve' },
  { email: 'manager@factory.com', role: 'Manager', desc: 'Approve PRs & plans' },
  { email: 'purchasing@factory.com', role: 'Purchasing', desc: 'Create PRs & POs' },
  { email: 'warehouse@factory.com', role: 'Warehouse', desc: 'Movements & GR' },
  { email: 'production@factory.com', role: 'Production', desc: 'BOMs, plans & WOs' },
  { email: 'qa@factory.com', role: 'QA', desc: 'QA inspection' },
  { email: 'sales@factory.com', role: 'Sales', desc: 'Manage SO & deliveries' },
];

const PATH_TO_TAB: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/master': 'master',
  '/master-data': 'master',
  '/purchasing': 'purchasing',
  '/procurement': 'purchasing',
  '/inventory': 'inventory',
  '/production': 'production',
  '/quality': 'quality',
  '/sales': 'sales',
  '/reports': 'reports',
  '/admin': 'admin',
  '/audit-logs': 'admin',
};

const TAB_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  master: '/master',
  purchasing: '/purchasing',
  inventory: '/inventory',
  production: '/production',
  quality: '/quality',
  sales: '/sales',
  reports: '/reports',
  admin: '/admin',
};

export default function App() {
  const { success, error, warning, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('superadmin@factory.com');
  const [loginPassword, setLoginPassword] = useState('FactoryMng2026!');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // App States & URL Navigation
  const [backendOffline, setBackendOffline] = useState(true);
  const initialPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const [activeTab, setActiveTab] = useState(PATH_TO_TAB[initialPath] || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync activeTab whenever URL pathname changes (e.g. Browser Back/Forward)
  useEffect(() => {
    const currentPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const matchedTab = PATH_TO_TAB[currentPath];
    if (matchedTab && matchedTab !== activeTab) {
      setActiveTab(matchedTab);
    }
  }, [location.pathname, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    const targetPath = TAB_TO_PATH[tab] || `/${tab}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Material Shortage Modal States
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [shortageWO, setShortageWO] = useState<WorkOrder | null>(null);
  const [shortageItems, setShortageItems] = useState<Array<{
    code: string;
    name: string;
    requiredQty: number;
    availableQty: number;
    isAvailable: boolean;
  }>>([]);

  // Telemetry KPIs
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalSales: 187500,
    totalPurchasing: 55000,
    netMargin: 132500,
    activeWOs: 0,
    lowStockItems: 1,
    qaPassRate: 98,
  });

  const [salesAndCostsChart, setSalesAndCostsChart] = useState<SalesAndCostsChartItem[]>([]);
  const [productionBreakdown, setProductionBreakdown] = useState<ProductionBreakdown>({
    draft: 0,
    pendingMaterial: 0,
    materialIssued: 0,
    inProduction: 0,
    pendingQA: 0,
    completed: 0,
  });
  const [dashboardRecentLogs, setDashboardRecentLogs] = useState<DashboardRecentLog[]>([]);

  // Initial Load & Auth Sync
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      loadMockInitialData();
    }
  }, [token]);

  // Recalculate KPIs on local changes
  useEffect(() => {
    if (backendOffline) {
      const sales = salesOrders
        .filter((so) => so.status === 'DELIVERED')
        .reduce((sum, so) => sum + so.totalAmount, 0) + 187500;
      const purch = purchaseOrders
        .filter((po) => po.status === 'APPROVED')
        .reduce((sum, po) => sum + po.totalAmount, 0) + 55000;
      const activeWO = workOrders.filter((wo) => wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED').length;
      const lowStock = stocks.filter((st) => st.status === 'LOW' || st.status === 'OUT').length;
      const passQA = inspections.filter((ins) => ins.status === 'PASS').length;
      const totalQA = inspections.length;
      const passRate = totalQA > 0 ? Math.round((passQA / totalQA) * 100) : 98;

      setKpis({
        totalSales: sales,
        totalPurchasing: purch,
        netMargin: sales - purch,
        activeWOs: activeWO,
        lowStockItems: lowStock,
        qaPassRate: passRate,
      });

      const pb: ProductionBreakdown = {
        draft: workOrders.filter((wo) => wo.status === 'DRAFT').length,
        pendingMaterial: workOrders.filter((wo) => wo.status === 'PENDING_MATERIAL').length,
        materialIssued: workOrders.filter((wo) => wo.status === 'MATERIAL_ISSUED').length,
        inProduction: workOrders.filter((wo) => wo.status === 'IN_PRODUCTION').length,
        pendingQA: workOrders.filter((wo) => wo.status === 'PENDING_QA').length,
        completed: workOrders.filter((wo) => wo.status === 'COMPLETED').length,
      };
      setProductionBreakdown(pb);

      setDashboardRecentLogs(
        auditLogs.slice(0, 6).map((l) => ({
          id: l.id,
          userEmail: l.userEmail || 'System Operator',
          action: l.action,
          entityName: l.entityName,
          createdAt: l.createdAt,
        }))
      );
    }
  }, [salesOrders, purchaseOrders, workOrders, stocks, inspections, auditLogs, backendOffline]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setCurrentUser(res.data);
      setBackendOffline(false);
      fetchBackendData();
    } catch (err) {
      console.log('Backend connection failed, loading offline mock preview mode.');
      setBackendOffline(true);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        setCurrentUser({
          id: 'u-1',
          email: 'superadmin@factory.com',
          fullName: 'Nuttaphong SuperAdmin',
          roles: ['Super Admin'],
          permissions: ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PURCHASE_CREATE', 'PURCHASE_APPROVE', 'STOCK_VIEW', 'STOCK_ADJUST', 'PRODUCTION_CREATE', 'PRODUCTION_APPROVE', 'REPORT_VIEW']
        });
      }
      loadMockInitialData();
    } finally {
      setLoading(false);
    }
  };

  const fetchBackendData = async () => {
    try {
      const fetchOr = async (url: string, fallback: any = []) => {
        try {
          const res = await api.get(url);
          return res.data;
        } catch (e) {
          console.log(`Fetch failed for ${url}:`, e);
          return fallback;
        }
      };

      const [
        prods, cats, units, supps, custs, whs,
        stocks, mvmts, prs, pos, grs, bomsData, plans,
        wos, inspects, sos, dels, audits, dash, notifs
      ] = await Promise.all([
        fetchOr('/products'),
        fetchOr('/categories'),
        fetchOr('/units'),
        fetchOr('/suppliers'),
        fetchOr('/customers'),
        fetchOr('/warehouses'),
        fetchOr('/inventory/stocks'),
        fetchOr('/inventory/movements'),
        fetchOr('/purchasing/requests'),
        fetchOr('/purchasing/orders'),
        fetchOr('/purchasing/receipts'),
        fetchOr('/production/boms'),
        fetchOr('/production/plans'),
        fetchOr('/production/orders'),
        fetchOr('/quality/inspections'),
        fetchOr('/sales/orders'),
        fetchOr('/sales/deliveries'),
        fetchOr('/audit-logs'),
        fetchOr('/reports/dashboard', null),
        fetchOr('/notifications')
      ]);

      setProducts(prods);
      setCategories(cats);
      setUnits(units);
      setSuppliers(supps);
      setCustomers(custs);
      setWarehouses(whs);
      setStocks(stocks);
      setMovements(mvmts);
      setPurchaseRequests(prs);
      setPurchaseOrders(pos);
      setGoodsReceipts(grs);
      setBoms(bomsData);
      setProductionPlans(plans);
      setWorkOrders(wos);
      setInspections(inspects);
      setSalesOrders(sos);
      setDeliveries(dels);
      setAuditLogs(audits);
      setNotifications(notifs);

      if (dash) {
        if (dash.kpis) setKpis(dash.kpis);
        if (dash.salesAndCostsChart) setSalesAndCostsChart(dash.salesAndCostsChart);
        if (dash.productionBreakdown) setProductionBreakdown(dash.productionBreakdown);
        if (dash.recentLogs) setDashboardRecentLogs(dash.recentLogs);
      }
    } catch (e) {
      console.log('Error syncing from backend, running offline engine.');
      setBackendOffline(true);
      loadMockInitialData();
    }
  };

  const loadMockInitialData = () => {
    const initialCats: Category[] = [
      { id: 'c-1', name: 'Raw Materials', description: 'Base stock items' },
      { id: 'c-2', name: 'Packaging', description: 'Wrapper goods' },
      { id: 'c-3', name: 'Finished Goods', description: 'Retail products' }
    ];
    setCategories(initialCats);

    const initialUnits: Unit[] = [
      { id: 'un-1', name: 'KG' },
      { id: 'un-2', name: 'PCS' },
      { id: 'un-3', name: 'SET' }
    ];
    setUnits(initialUnits);

    const initialWhs: Warehouse[] = [
      { id: 'w-1', code: 'WH-A', name: 'Main Raw Storage', location: 'Section A' },
      { id: 'w-2', code: 'WH-B', name: 'Finished Goods Room', location: 'Section B' }
    ];
    setWarehouses(initialWhs);

    const initialSuppliers: Supplier[] = [
      { id: 's-1', name: 'ABC Manufacturing', contactName: 'John', email: 'john@abc.com', phone: '0812345678', address: 'Bangkok' }
    ];
    setSuppliers(initialSuppliers);

    const initialCustomers: Customer[] = [
      { id: 'cust-1', name: 'Retail Group Inc', contactName: 'Jane', email: 'jane@retail.com', phone: '0898765432', address: 'Chonburi' }
    ];
    setCustomers(initialCustomers);

    const initialProducts: Product[] = [
      { id: 'p-1', code: 'RM-STEEL', name: 'Steel Sheet', category: initialCats[0], type: 'RAW_MATERIAL', unit: initialUnits[0], cost: 500, price: 0, minimumStock: 200, maximumStock: 5000, warehouse: initialWhs[0], status: 'ACTIVE' },
      { id: 'p-2', code: 'RM-PLASTIC', name: 'Granular Plastic', category: initialCats[0], type: 'RAW_MATERIAL', unit: initialUnits[0], cost: 100, price: 0, minimumStock: 300, maximumStock: 3000, warehouse: initialWhs[0], status: 'ACTIVE' },
      { id: 'p-3', code: 'RM-BOLT', name: 'Steel Bolt M8', category: initialCats[0], type: 'RAW_MATERIAL', unit: initialUnits[1], cost: 5, price: 0, minimumStock: 1000, maximumStock: 20000, warehouse: initialWhs[0], status: 'ACTIVE' },
      { id: 'p-4', code: 'PK-BOX', name: 'Cardboard Box Standard', category: initialCats[1], type: 'PACKAGING', unit: initialUnits[2], cost: 20, price: 0, minimumStock: 500, maximumStock: 5000, warehouse: initialWhs[0], status: 'ACTIVE' },
      { id: 'p-5', code: 'FG-PRODUCT-A', name: 'Finished Machine A', category: initialCats[2], type: 'FINISHED_GOOD', unit: initialUnits[1], cost: 1500, price: 2500, minimumStock: 50, maximumStock: 1000, warehouse: initialWhs[1], status: 'ACTIVE' }
    ];
    setProducts(initialProducts);

    const initialStocks: Stock[] = [
      { id: 'st-1', product: initialProducts[0], warehouse: initialWhs[0], quantity: 850, status: 'NORMAL', updatedAt: '2026-08-16 12:00' },
      { id: 'st-2', product: initialProducts[1], warehouse: initialWhs[0], quantity: 120, status: 'LOW', updatedAt: '2026-08-16 12:00' },
      { id: 'st-3', product: initialProducts[2], warehouse: initialWhs[0], quantity: 5000, status: 'NORMAL', updatedAt: '2026-08-16 12:00' },
      { id: 'st-4', product: initialProducts[3], warehouse: initialWhs[0], quantity: 1000, status: 'NORMAL', updatedAt: '2026-08-16 12:00' },
      { id: 'st-5', product: initialProducts[4], warehouse: initialWhs[1], quantity: 75, status: 'NORMAL', updatedAt: '2026-08-16 12:00' }
    ];
    setStocks(initialStocks);

    const initialBoms: BOM[] = [
      {
        id: 'bom-1',
        code: 'BOM-FG-A',
        product: initialProducts[4],
        isActive: true,
        items: [
          { id: 'bomi-1', product: initialProducts[0], quantityNeeded: 2 },
          { id: 'bomi-2', product: initialProducts[1], quantityNeeded: 1 },
          { id: 'bomi-3', product: initialProducts[2], quantityNeeded: 4 },
          { id: 'bomi-4', product: initialProducts[3], quantityNeeded: 1 }
        ]
      }
    ];
    setBoms(initialBoms);

    const initialPRs: PurchaseRequest[] = [
      {
        id: 'pr-1',
        code: 'PR-2026-00001',
        requester: { id: 'u-1', fullName: 'Jane Purchasing' },
        status: 'PENDING_APPROVAL',
        totalAmount: 70000,
        items: [
          { id: 'pri-1', product: initialProducts[0], quantity: 100, estimatedPrice: 500, totalPrice: 50000 },
          { id: 'pri-2', product: initialProducts[1], quantity: 200, estimatedPrice: 100, totalPrice: 20000 }
        ],
        comment: 'Urgent restocking',
        createdAt: '2026-08-16 14:00'
      }
    ];
    setPurchaseRequests(initialPRs);

    const initialNotifs: SystemNotification[] = [
      { id: 'nt-1', title: 'PR Pending Approval', message: 'Purchase Request PR-2026-00001 is waiting for approval.', isRead: false, recipientRole: 'Manager', entityType: 'PURCHASE_REQUEST', entityId: 'pr-1', createdAt: '2026-08-16 14:02' },
      { id: 'nt-2', title: 'Low Stock Alert', message: 'Granular Plastic (RM-PLASTIC) is below minimum stock limit.', isRead: false, recipientRole: 'Warehouse', entityType: 'STOCK', entityId: 'st-2', createdAt: '2026-08-16 12:00' }
    ];
    setNotifications(initialNotifs);

    const initialAudits: AuditLog[] = [
      { id: 'au-1', userEmail: 'purchasing@factory.com', action: 'CREATE_PR', entityName: 'PurchaseRequest', entityId: 'pr-1', afterState: JSON.stringify({ totalAmount: 70000 }), ipAddress: '192.168.1.55', createdAt: '2026-08-16 14:00' }
    ];
    setAuditLogs(initialAudits);
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.accessToken);
      setCurrentUser(res.data.user);
      setBackendOffline(false);
    } catch (err: any) {
      console.log('Login failed, running offline mock session.');
      const matchingMock = MOCK_CREDENTIALS.find((c) => c.email === loginEmail);
      if (matchingMock) {
        const dummyUser = {
          id: 'u-temp',
          email: matchingMock.email,
          fullName: matchingMock.email.split('@')[0].toUpperCase(),
          roles: [matchingMock.role],
          permissions: matchingMock.role === 'Super Admin'
            ? ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PURCHASE_CREATE', 'PURCHASE_APPROVE', 'STOCK_VIEW', 'STOCK_ADJUST', 'PRODUCTION_CREATE', 'PRODUCTION_APPROVE', 'REPORT_VIEW']
            : ['PRODUCT_VIEW', 'STOCK_VIEW', 'REPORT_VIEW']
        };

        if (matchingMock.role === 'Manager') dummyUser.permissions.push('PURCHASE_APPROVE', 'PRODUCTION_APPROVE');
        if (matchingMock.role === 'Purchasing') dummyUser.permissions.push('PURCHASE_CREATE');
        if (matchingMock.role === 'Warehouse') dummyUser.permissions.push('STOCK_ADJUST');
        if (matchingMock.role === 'Production') dummyUser.permissions.push('PRODUCTION_CREATE');
        if (matchingMock.role === 'QA') dummyUser.permissions.push('REPORT_VIEW');
        if (matchingMock.role === 'Sales') dummyUser.permissions.push('PRODUCT_CREATE');

        localStorage.setItem('token', 'mock_jwt_token_123');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        setToken('mock_jwt_token_123');
        setCurrentUser(dummyUser);
      } else {
        setLoginError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    navigate('/');
  };

  const hasPermission = (code: string) => {
    if (!currentUser) return false;
    if (currentUser.roles.includes('Super Admin')) return true;
    return currentUser.permissions.includes(code);
  };

  // --- OFFLINE WORKFLOW ENGINES (LOCAL SIMULATION) ---
  const addAuditLogLocal = (action: string, entity: string, id: string, before?: any, after?: any) => {
    const newLog: AuditLog = {
      id: `au-${Date.now()}`,
      userEmail: currentUser?.email || 'system@factory.com',
      action,
      entityName: entity,
      entityId: id,
      beforeState: before ? JSON.stringify(before) : undefined,
      afterState: after ? JSON.stringify(after) : undefined,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const triggerNotificationLocal = (title: string, message: string, role?: string, type?: string, id?: string) => {
    const newNotif: SystemNotification = {
      id: `nt-${Date.now()}`,
      title,
      message,
      isRead: false,
      recipientRole: role,
      entityType: type,
      entityId: id,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleCreatePR = async (itemsList: { productId: string; quantity: number; estimatedPrice: number }[]) => {
    if (!backendOffline) {
      try {
        await api.post('/purchasing/requests', { items: itemsList });
        fetchBackendData();
        success('Purchase Request submitted successfully!');
        return true;
      } catch (e) {
        error('API error creating Purchase Request');
        return false;
      }
    }

    const code = `PR-2026-${String(purchaseRequests.length + 1).padStart(5, '0')}`;
    let total = 0;
    const items = itemsList.map((formItem, index) => {
      const product = products.find((p) => p.id === formItem.productId)!;
      const lineTotal = formItem.quantity * formItem.estimatedPrice;
      total += lineTotal;
      return {
        id: `pri-${Date.now()}-${index}`,
        product,
        quantity: formItem.quantity,
        estimatedPrice: formItem.estimatedPrice,
        totalPrice: lineTotal
      };
    });

    const newPR: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      code,
      requester: { id: currentUser?.id || 'u-1', fullName: currentUser?.fullName || 'Requester' },
      status: 'DRAFT',
      totalAmount: total,
      items,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setPurchaseRequests((prev) => [newPR, ...prev]);
    addAuditLogLocal('CREATE_PR', 'PurchaseRequest', newPR.id, null, { totalAmount: total });
    success(`Purchase Request ${code} created successfully!`);
    return true;
  };

  const handleSubmitPR = async (prId: string) => {
    if (!backendOffline) {
      try {
        await api.patch(`/purchasing/requests/${prId}/submit`);
        fetchBackendData();
        success('PR submitted for manager approval.');
        return;
      } catch (e) {
        error('API submission failed');
      }
    }

    setPurchaseRequests((prev) =>
      prev.map((pr) => {
        if (pr.id === prId) {
          addAuditLogLocal('SUBMIT_PR', 'PurchaseRequest', prId, { status: pr.status }, { status: 'PENDING_APPROVAL' });
          let requiredRole = 'Manager';
          triggerNotificationLocal(
            'PR Pending Approval',
            `Purchase Request ${pr.code} (Total: ${pr.totalAmount} THB) requires approval.`,
            requiredRole,
            'PURCHASE_REQUEST',
            prId
          );
          success(`PR ${pr.code} submitted for approval.`);
          return { ...pr, status: 'PENDING_APPROVAL' };
        }
        return pr;
      })
    );
  };

  const handlePRDecision = async (prId: string, action: 'APPROVE' | 'REJECT', comment: string) => {
    if (!backendOffline) {
      try {
        const payloadComment = comment || 'No comment';
        await api.patch(`/purchasing/requests/${prId}/${action.toLowerCase()}`, { comment: payloadComment });
        fetchBackendData();
        success(`PR ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`);
        return true;
      } catch (e: any) {
        const errMsg = e.response?.data?.message || 'API approval error';
        error(errMsg);
        return false;
      }
    }

    setPurchaseRequests((prev) =>
      prev.map((pr) => {
        if (pr.id === prId) {
          const finalStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
          addAuditLogLocal('DECISION_PR', 'PurchaseRequest', prId, { status: pr.status }, { status: finalStatus, comment });

          triggerNotificationLocal(
            `PR ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
            `Your Purchase Request ${pr.code} has been ${finalStatus.toLowerCase()}.`,
            undefined,
            'PURCHASE_REQUEST',
            pr.id
          );

          if (action === 'APPROVE') {
            const poCode = `PO-2026-${String(purchaseOrders.length + 1).padStart(5, '0')}`;
            const newPO: PurchaseOrder = {
              id: `po-${Date.now()}`,
              code: poCode,
              supplier: suppliers[0] || { id: 's-1', name: 'ABC Manufacturing' },
              buyer: { fullName: currentUser?.fullName || 'Buyer' },
              status: 'APPROVED',
              totalAmount: pr.totalAmount,
              items: pr.items.map((i, idx) => ({
                id: `poi-${Date.now()}-${idx}`,
                product: i.product,
                quantity: i.quantity,
                price: i.estimatedPrice,
                totalPrice: i.totalPrice
              })),
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
            };
            setPurchaseOrders((prevPOs) => [newPO, ...prevPOs]);
            addAuditLogLocal('GENERATE_PO', 'PurchaseOrder', newPO.id, null, { code: poCode });
            triggerNotificationLocal(
              'New PO Generated',
              `Purchase Order ${newPO.code} generated from PR ${pr.code}. Ready for shipment receipt.`,
              'Warehouse',
              'PURCHASE_ORDER',
              newPO.id
            );
          }

          return { ...pr, status: finalStatus, comment };
        }
        return pr;
      })
    );

    return true;
  };

  const handleCreateReceipt = async (po: PurchaseOrder) => {
    if (!backendOffline) {
      try {
        const payload = {
          poId: po.id,
          items: po.items.map((i) => ({ productId: i.product.id, quantityReceived: i.quantity }))
        };
        await api.post('/purchasing/receipts', payload);
        fetchBackendData();
        success(`Goods Receipt created for ${po.code}! Sent to QA for inspection.`);
        return;
      } catch (e) {
        error('API Goods Receipt creation failed');
      }
    }

    const code = `GR-2026-${String(goodsReceipts.length + 1).padStart(5, '0')}`;
    const newGR: GoodsReceipt = {
      id: `gr-${Date.now()}`,
      code,
      purchaseOrder: po,
      receivedBy: { fullName: currentUser?.fullName || 'Receiver' },
      status: 'PENDING_QA',
      items: po.items.map((i, idx) => ({
        id: `gri-${Date.now()}-${idx}`,
        product: i.product,
        quantityReceived: i.quantity,
        quantityAccepted: 0,
        quantityRejected: 0
      })),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setGoodsReceipts((prev) => [newGR, ...prev]);
    addAuditLogLocal('CREATE_GOODS_RECEIPT', 'GoodsReceipt', newGR.id, null, { code });
    triggerNotificationLocal(
      'QA Inspection Required',
      `Goods Receipt ${newGR.code} (PO: ${po.code}) requires inspection.`,
      'QA',
      'GOODS_RECEIPT',
      newGR.id
    );
    info(`Goods Receipt ${newGR.code} created and sent to QA for quality checks.`);
  };

  const handleAdjustStock = async (productId: string, warehouseId: string, quantity: number) => {
    if (!backendOffline) {
      try {
        await api.post('/inventory/adjustment', { productId, warehouseId, quantity });
        fetchBackendData();
        success('Stock level adjusted successfully!');
        return true;
      } catch (err) {
        error('API stock adjust failed');
        return false;
      }
    }

    const prod = products.find((p) => p.id === productId)!;
    const wh = warehouses.find((w) => w.id === warehouseId)!;

    setStocks((prev) => {
      let found = false;
      const updated = prev.map((st) => {
        if (st.product.id === prod.id && st.warehouse.id === wh.id) {
          found = true;
          const oldQty = st.quantity;
          const diff = quantity - oldQty;
          addAuditLogLocal('STOCK_ADJUSTMENT', 'Stock', st.id, { quantity: oldQty }, { quantity, diff });

          const newMovement: StockMovement = {
            id: `mvm-${Date.now()}`,
            type: 'ADJUSTMENT',
            product: prod,
            toWarehouse: diff > 0 ? wh : undefined,
            fromWarehouse: diff < 0 ? wh : undefined,
            quantity: Math.abs(diff),
            referenceType: 'MANUAL_ADJUST',
            user: { fullName: currentUser?.fullName || 'Operator' },
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          setMovements((pMove) => [newMovement, ...pMove]);

          return {
            ...st,
            quantity,
            status: quantity <= 0 ? 'OUT' : quantity < prod.minimumStock ? 'LOW' : 'NORMAL' as any,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return st;
      });

      if (!found) {
        const newStock: Stock = {
          id: `st-${Date.now()}`,
          product: prod,
          warehouse: wh,
          quantity,
          status: quantity <= 0 ? 'OUT' : quantity < prod.minimumStock ? 'LOW' : 'NORMAL' as any,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        addAuditLogLocal('STOCK_ADJUSTMENT_NEW', 'Stock', newStock.id, null, { quantity });
        return [...updated, newStock];
      }
      return updated;
    });

    return true;
  };

  const handleCreatePlan = async (productId: string, targetQuantity: number, startDate: string, endDate: string) => {
    if (!backendOffline) {
      try {
        await api.post('/production/plans', { productId, targetQuantity, startDate, endDate });
        fetchBackendData();
        success('Production plan created successfully!');
        return true;
      } catch (err) {
        error('API plan creation failed');
        return false;
      }
    }

    const prod = products.find((p) => p.id === productId)!;
    const newPlan: ProductionPlan = {
      id: `pln-${Date.now()}`,
      code: `PLN-2026-${String(productionPlans.length + 1).padStart(5, '0')}`,
      product: prod,
      targetQuantity,
      startDate,
      endDate,
      status: 'PENDING',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setProductionPlans((prev) => [newPlan, ...prev]);
    success(`Production Plan ${newPlan.code} created!`);
    return true;
  };

  const handleCreateWO = async (productId: string, quantity: number, planId?: string, assignedToId?: string) => {
    if (!backendOffline) {
      try {
        await api.post('/production/orders', {
          productId,
          quantity,
          productionPlanId: planId,
          assignedToId: assignedToId || 'production@factory.com'
        });
        fetchBackendData();
        success('Work Order created successfully!');
        return true;
      } catch (err) {
        error('API WO creation failed');
        return false;
      }
    }

    const prod = products.find((p) => p.id === productId)!;
    const assignedUser = MOCK_CREDENTIALS.find((c) => c.email.includes(assignedToId || 'production@factory.com')) || MOCK_CREDENTIALS[0];

    const newWO: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: `WO-2026-${String(workOrders.length + 1).padStart(5, '0')}`,
      product: prod,
      quantity,
      status: 'DRAFT',
      assignedTo: { id: assignedToId || 'production@factory.com', fullName: assignedUser.role },
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setWorkOrders((prev) => [newWO, ...prev]);
    success(`Work Order ${newWO.code} registered!`);
    return true;
  };

  const handleIssueMaterials = async (wo: WorkOrder) => {
    if (!backendOffline) {
      try {
        const checkRes = await api.get(`/production/orders/${wo.id}/requirements`);
        const check = checkRes.data;
        if (!check.allAvailable) {
          const mappedShortages = check.requirements.map((r: any) => ({
            code: r.code,
            name: r.name,
            requiredQty: Number(r.requiredQty),
            availableQty: Number(r.availableQty),
            isAvailable: r.isAvailable
          }));
          setShortageWO(wo);
          setShortageItems(mappedShortages);
          setShowShortageModal(true);

          await api.post(`/production/orders/${wo.id}/issue`, { warehouseId: warehouses[0].id }).catch(() => {});
          fetchBackendData();
          warning('Insufficient materials in stock. Please review shortages.');
          return;
        }

        await api.post(`/production/orders/${wo.id}/issue`, { warehouseId: warehouses[0].id });
        fetchBackendData();
        success('Materials issued successfully!');
        return;
      } catch (err: any) {
        error(err.response?.data?.message || 'Stock insufficient to issue materials.');
      }
    }

    const bom = boms.find((b) => b.product.id === wo.product.id);
    if (!bom) {
      error('No active BOM config found for this product!');
      return;
    }

    let allAvail = true;
    const requirements = bom.items.map((bItem) => {
      const required = bItem.quantityNeeded * wo.quantity;
      const stock = stocks.find((st) => st.product.id === bItem.product.id);
      const avail = stock ? stock.quantity : 0;
      if (avail < required) allAvail = false;
      return { product: bItem.product, required, avail };
    });

    if (!allAvail) {
      setWorkOrders((prev) =>
        prev.map((o) => (o.id === wo.id ? { ...o, status: 'PENDING_MATERIAL' as any } : o))
      );
      const mappedShortages = requirements.map((r) => ({
        code: r.product.code,
        name: r.product.name,
        requiredQty: r.required,
        availableQty: r.avail,
        isAvailable: r.avail >= r.required
      }));
      setShortageWO(wo);
      setShortageItems(mappedShortages);
      setShowShortageModal(true);
      warning('Stock insufficient for some components. Review shortage modal.');
      return;
    }

    setStocks((prevStocks) =>
      prevStocks.map((st) => {
        const req = requirements.find((r) => r.product.id === st.product.id);
        if (req) {
          const oldQty = st.quantity;
          const newQty = oldQty - req.required;

          const newMovement: StockMovement = {
            id: `mvm-${Date.now()}-${st.product.code}`,
            type: 'STOCK_OUT',
            product: st.product,
            fromWarehouse: st.warehouse,
            quantity: req.required,
            referenceType: 'WORK_ORDER_ISSUE',
            referenceId: wo.id,
            user: { fullName: currentUser?.fullName || 'Production Eng' },
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          setMovements((prevM) => [newMovement, ...prevM]);
          addAuditLogLocal('MATERIAL_ISSUE', 'Stock', st.id, { quantity: oldQty }, { quantity: newQty });

          return {
            ...st,
            quantity: newQty,
            status: newQty <= 0 ? 'OUT' : newQty < st.product.minimumStock ? 'LOW' : 'NORMAL' as any
          };
        }
        return st;
      })
    );

    setWorkOrders((prev) =>
      prev.map((o) => (o.id === wo.id ? { ...o, status: 'MATERIAL_ISSUED' as any } : o))
    );
    success('BOM requirements verified. Materials checked out from WH-A successfully.');
  };

  const handleStartProduction = async (woId: string) => {
    if (!backendOffline) {
      try {
        await api.patch(`/production/orders/${woId}/start`);
        fetchBackendData();
        success('Work order moved to In Production!');
        return;
      } catch (err) {
        error('API start production failed');
      }
    }

    setWorkOrders((prev) =>
      prev.map((o) => (o.id === woId ? { ...o, status: 'IN_PRODUCTION' as any } : o))
    );
    success('Production process started!');
  };

  const handleReportResult = async (wo: WorkOrder, qty: number, defective: number) => {
    if (!backendOffline) {
      try {
        await api.post(`/production/orders/${wo.id}/result`, { qtyProduced: qty, qtyDefective: defective });
        fetchBackendData();
        success('Yield report submitted, sent to QA.');
        return true;
      } catch (err) {
        error('API yield report failed');
        return false;
      }
    }

    setWorkOrders((prev) =>
      prev.map((o) => (o.id === wo.id ? { ...o, status: 'PENDING_QA' as any } : o))
    );

    triggerNotificationLocal(
      'Production QA Inspection Required',
      `Work Order ${wo.code} completed. QA inspection required. Defective: ${defective} units reported.`,
      'QA',
      'WORK_ORDER',
      wo.id
    );

    info('Production batch yield reported. Work Order status set to PENDING_QA.');
    return true;
  };

  const handleCreateInspection = async (inspectFormPayload: any) => {
    if (!backendOffline) {
      try {
        await api.post('/quality/inspections', inspectFormPayload);
        fetchBackendData();
        success('Quality inspection record submitted!');
        return true;
      } catch (err) {
        error('API QC inspection creation failed');
        return false;
      }
    }

    const prod = products.find((p) => p.id === inspectFormPayload.productId)!;
    const newInspect: QualityInspection = {
      id: `qa-${Date.now()}`,
      code: `QA-2026-${String(inspections.length + 1).padStart(5, '0')}`,
      product: prod,
      batchNo: inspectFormPayload.batchNo,
      inspector: { fullName: currentUser?.fullName || 'QA Inspector' },
      weight: inspectFormPayload.weight,
      size: inspectFormPayload.size,
      color: inspectFormPayload.color,
      temperature: inspectFormPayload.temperature,
      defectDetails: inspectFormPayload.defectDetails,
      status: inspectFormPayload.status,
      comment: inspectFormPayload.comment,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setInspections((prev) => [newInspect, ...prev]);
    addAuditLogLocal('QA_INSPECTION', 'QualityInspection', newInspect.id, null, { status: inspectFormPayload.status });

    if (inspectFormPayload.goodsReceiptId) {
      const gr = goodsReceipts.find((g) => g.id === inspectFormPayload.goodsReceiptId)!;
      if (inspectFormPayload.status === 'PASS') {
        gr.status = 'QA_PASSED';
        gr.items.forEach((item) => {
          setStocks((prevStocks) =>
            prevStocks.map((st) => {
              if (st.product.id === item.product.id && st.warehouse.id === warehouses[0].id) {
                const oldQty = st.quantity;
                const newQty = oldQty + item.quantityReceived;

                const newMovement: StockMovement = {
                  id: `mvm-${Date.now()}-${item.product.code}`,
                  type: 'STOCK_IN',
                  product: item.product,
                  toWarehouse: warehouses[0],
                  quantity: item.quantityReceived,
                  referenceType: 'GOODS_RECEIPT_QA_PASS',
                  referenceId: gr.id,
                  user: { fullName: currentUser?.fullName || 'QA' },
                  createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };
                setMovements((prevM) => [newMovement, ...prevM]);

                return {
                  ...st,
                  quantity: newQty,
                  status: newQty < st.product.minimumStock ? 'LOW' : 'NORMAL' as any
                };
              }
              return st;
            })
          );
        });
        success('QA Passed! Raw materials stored in WH-A inventory.');
      } else {
        gr.status = 'QA_FAILED';
        triggerNotificationLocal(
          'QA Inspection Failed',
          `Goods Receipt ${gr.code} failed QA. Status: ${inspectFormPayload.status}. Returned to supplier.`,
          'Warehouse',
          'QUALITY_INSPECTION',
          newInspect.id
        );
        warning('QA Failed! Materials rejected and logged for return to supplier.');
      }
    } else if (inspectFormPayload.workOrderId) {
      const wo = workOrders.find((w) => w.id === inspectFormPayload.workOrderId)!;
      if (inspectFormPayload.status === 'PASS') {
        wo.status = 'COMPLETED';
        setStocks((prevStocks) =>
          prevStocks.map((st) => {
            if (st.product.id === wo.product.id && st.warehouse.id === warehouses[1].id) {
              const oldQty = st.quantity;
              const newQty = oldQty + wo.quantity;

              const newMovement: StockMovement = {
                id: `mvm-${Date.now()}-${wo.product.code}`,
                type: 'STOCK_IN',
                product: wo.product,
                toWarehouse: warehouses[1],
                quantity: wo.quantity,
                referenceType: 'WORK_ORDER_QA_PASS',
                referenceId: wo.id,
                user: { fullName: currentUser?.fullName || 'QA' },
                createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
              };
              setMovements((prevM) => [newMovement, ...prevM]);

              return {
                ...st,
                quantity: newQty,
                status: newQty < st.product.minimumStock ? 'LOW' : 'NORMAL' as any
              };
            }
            return st;
          })
        );
        success('QA Passed! Finished goods stocked into WH-B inventory.');
      } else {
        wo.status = 'COMPLETED';
        triggerNotificationLocal(
          'Production Defect Reported',
          `Finished goods for Work Order ${wo.code} failed inspection checks.`,
          'Production',
          'QUALITY_INSPECTION',
          newInspect.id
        );
        warning('QA Rejected! Work order finished, defect reports generated.');
      }
    }

    return true;
  };

  const handleCreateSalesOrder = async (customerId: string, itemsList: { productId: string; quantity: number; price: number }[]) => {
    if (!backendOffline) {
      try {
        await api.post('/sales/orders', { customerId, items: itemsList });
        fetchBackendData();
        success('Sales Order created successfully!');
        return true;
      } catch (err) {
        error('API Sales Order creation failed');
        return false;
      }
    }

    const customer = customers.find((c) => c.id === customerId)!;
    let total = 0;
    const items = itemsList.map((formItem, index) => {
      const product = products.find((p) => p.id === formItem.productId)!;
      const lineTotal = formItem.quantity * formItem.price;
      total += lineTotal;
      return {
        id: `soi-${Date.now()}-${index}`,
        product,
        quantity: formItem.quantity,
        quantityReserved: 0,
        price: formItem.price,
        totalPrice: lineTotal
      };
    });

    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      code: `SO-2026-${String(salesOrders.length + 1).padStart(5, '0')}`,
      customer,
      salesperson: { fullName: currentUser?.fullName || 'Sales Agent' },
      status: 'DRAFT',
      totalAmount: total,
      items,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setSalesOrders((prev) => [newSO, ...prev]);
    success(`Sales Order ${newSO.code} created!`);
    return true;
  };

  const handleCreateProduct = async (payload: any) => {
    if (!backendOffline) {
      try {
        await api.post('/products', payload);
        fetchBackendData();
        success(`Product ${payload.code} created successfully!`);
        return true;
      } catch (err) {
        error('API error creating product');
        return false;
      }
    }

    const cat = categories.find(c => c.id === payload.categoryId)!;
    const unit = units.find(u => u.id === payload.unitId)!;
    const wh = warehouses.find(w => w.id === payload.warehouseId);
    const newP: Product = {
      id: `p-${Date.now()}`,
      code: payload.code,
      name: payload.name,
      category: cat,
      type: payload.type,
      unit,
      cost: payload.cost,
      price: payload.price,
      minimumStock: payload.minimumStock,
      maximumStock: payload.maximumStock,
      warehouse: wh,
      status: 'ACTIVE'
    };
    setProducts(prev => [...prev, newP]);
    if (wh) {
      setStocks(prev => [...prev, {
        id: `st-${Date.now()}`,
        product: newP,
        warehouse: wh,
        quantity: 0,
        status: 'OUT',
        updatedAt: new Date().toISOString().substring(0, 16)
      }]);
    }
    addAuditLogLocal('CREATE_PRODUCT', 'Product', newP.id, null, { code: payload.code });
    return true;
  };

  const handleReserveStock = async (so: SalesOrder) => {
    if (!backendOffline) {
      try {
        await api.patch(`/sales/orders/${so.id}/reserve`);
        fetchBackendData();
        success(`Stock reserved for Sales Order ${so.code}!`);
        return;
      } catch (err: any) {
        error(err.response?.data?.message || 'Inventory insufficient to reserve stock.');
      }
    }

    let allAvail = true;
    for (const item of so.items) {
      const stock = stocks.find((st) => st.product.id === item.product.id && st.warehouse.id === warehouses[1].id);
      const qty = stock ? stock.quantity : 0;
      if (qty < item.quantity) {
        allAvail = false;
        break;
      }
    }

    if (!allAvail) {
      warning('Cannot reserve stock. Finished goods warehouse (WH-B) does not have enough quantities!');
      return;
    }

    setStocks((prev) =>
      prev.map((st) => {
        const matched = so.items.find((i) => i.product.id === st.product.id);
        if (matched && st.warehouse.id === warehouses[1].id) {
          const oldQty = st.quantity;
          const newQty = oldQty - matched.quantity;
          addAuditLogLocal('STOCK_RESERVE_SALES', 'Stock', st.id, { quantity: oldQty }, { quantity: newQty });

          const newMovement: StockMovement = {
            id: `mvm-${Date.now()}`,
            type: 'STOCK_OUT',
            product: st.product,
            fromWarehouse: st.warehouse,
            quantity: matched.quantity,
            referenceType: 'SO_RESERVE',
            referenceId: so.id,
            user: { fullName: currentUser?.fullName || 'Sales' },
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          setMovements((pMove) => [newMovement, ...pMove]);

          return {
            ...st,
            quantity: newQty,
            status: newQty <= 0 ? 'OUT' : newQty < st.product.minimumStock ? 'LOW' : 'NORMAL' as any
          };
        }
        return st;
      })
    );

    setSalesOrders((prev) =>
      prev.map((o) => {
        if (o.id === so.id) {
          addAuditLogLocal('RESERVE_SO_STOCK', 'SalesOrder', so.id, { status: so.status }, { status: 'RESERVED' });
          return { ...o, status: 'RESERVED' };
        }
        return o;
      })
    );
    success('Stock reserved successfully from WH-B finished goods room.');
  };

  const handleCreateDelivery = async (so: SalesOrder) => {
    if (!backendOffline) {
      try {
        await api.post(`/sales/orders/${so.id}/delivery`);
        fetchBackendData();
        success('Shipment dispatched successfully!');
        return;
      } catch (err) {
        error('API dispatch failed');
      }
    }

    const dCode = `DEL-2026-${String(deliveries.length + 1).padStart(5, '0')}`;
    const newDelivery: Delivery = {
      id: `d-${Date.now()}`,
      code: dCode,
      salesOrder: so,
      shippedBy: { fullName: currentUser?.fullName || 'Logistics Partner' },
      status: 'DELIVERED',
      deliveryDate: new Date().toISOString().substring(0, 10),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setDeliveries((prev) => [newDelivery, ...prev]);
    setSalesOrders((prev) =>
      prev.map((o) => (o.id === so.id ? { ...o, status: 'DELIVERED' as any } : o))
    );

    addAuditLogLocal('DISPATCH_DELIVERY', 'Delivery', newDelivery.id, null, { code: dCode });
    success(`Sales Order ${so.code} dispatched! Voucher ${dCode} printed.`);
  };

  // --- RENDERING VIEWS ---
  if (!token) {
    return (
      <div className="auth-container">
        <form className="auth-card" onSubmit={handleLogin}>
          <div className="auth-header">
            <div className="auth-logo">
              <Factory size={28} style={{ display: 'inline', marginRight: '8px', color: '#FF7A00' }} />
              FMS <span>Portal</span>
            </div>
            <div className="auth-title" style={{ marginTop: '8px' }}>
              Sign in to Factory Management System
            </div>
          </div>

          {loginError && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: 600 }}>
              {loginError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
            Authorize Login
          </Button>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
            <p style={{ color: 'var(--text-sub)', fontWeight: 600, marginBottom: '8px' }}>Demo Preset Credentials (Click to autofill):</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {MOCK_CREDENTIALS.map((cred) => (
                <li
                  key={cred.email}
                  onClick={() => { setLoginEmail(cred.email); setLoginPassword('FactoryMng2026!'); }}
                  style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                >
                  <strong style={{ color: 'var(--primary-color)' }}>{cred.role}</strong>: {cred.email}
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Factory size={22} style={{ color: '#FF7A00' }} />
            FMS <span>Panel</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div className={`menu-item ${activeTab === 'master' ? 'active' : ''}`} onClick={() => handleTabChange('master')}>
            <Package size={18} /> Master Catalog
          </div>
          <div className={`menu-item ${activeTab === 'purchasing' ? 'active' : ''}`} onClick={() => handleTabChange('purchasing')}>
            <ShoppingCart size={18} /> Purchasing
          </div>
          <div className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => handleTabChange('inventory')}>
            <Boxes size={18} /> Inventory
          </div>
          <div className={`menu-item ${activeTab === 'production' ? 'active' : ''}`} onClick={() => handleTabChange('production')}>
            <Factory size={18} /> Production
          </div>
          <div className={`menu-item ${activeTab === 'quality' ? 'active' : ''}`} onClick={() => handleTabChange('quality')}>
            <TrendingUp size={18} /> QA Inspection
          </div>
          <div className={`menu-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => handleTabChange('sales')}>
            <Truck size={18} /> Sales & Dispatch
          </div>
          <div className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleTabChange('reports')}>
            <TrendingUp size={18} /> Yield Reports
          </div>
          <div className={`menu-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleTabChange('admin')}>
            <Settings size={18} /> Action Audit Log
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0
            }}>
              {currentUser?.fullName?.substring(0, 2) || 'SA'}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser?.fullName || 'Nuttaphong'}</span>
              <span className="user-role">{currentUser?.roles?.[0] || 'Super Admin'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-sub)'}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content frame */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="navbar-title" style={{ textTransform: 'capitalize' }}>
                {activeTab.replace('-', ' ')}
              </h2>
              {backendOffline && (
                <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <AlertTriangle size={12} /> Running in Local Mock Preview Mode (Back-end Offline)
                </span>
              )}
            </div>
          </div>

          <div className="navbar-actions">
            {/* Notification Bell */}
            <div className="notification-bell-container" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              {notifications.some((n) => !n.isRead) && <div className="notification-badge" />}
            </div>

            {/* Notification List Dropdown */}
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-panel-header">🔔 Notifications Center</div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                      No new alerts.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!backendOffline) await api.patch(`/notifications/${n.id}/read`);
                          setNotifications((prev) =>
                            prev.map((not) => (not.id === n.id ? { ...not, isRead: true } : not))
                          );
                          setShowNotifications(false);
                          if (n.entityType === 'PURCHASE_REQUEST') setActiveTab('purchasing');
                          if (n.entityType === 'STOCK') setActiveTab('inventory');
                          if (n.entityType === 'WORK_ORDER') setActiveTab('production');
                          if (n.entityType === 'GOODS_RECEIPT') setActiveTab('quality');
                        }}
                        className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                      >
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-desc">{n.message}</div>
                        <div className="notification-item-time">{n.createdAt}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div style={{ borderLeft: '1px solid #2D333F', height: '24px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
              <Activity size={14} style={{ color: '#22C55E' }} /> Active Session
            </div>
          </div>
        </header>

        <main className="content-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              kpis={kpis}
              salesAndCostsChart={salesAndCostsChart}
              productionBreakdown={productionBreakdown}
              recentLogs={dashboardRecentLogs}
            />
          )}

          {activeTab === 'master' && (
            <MasterDataView
              products={products}
              categories={categories}
              units={units}
              warehouses={warehouses}
              hasPermission={hasPermission}
              onCreateProduct={handleCreateProduct}
            />
          )}

          {activeTab === 'purchasing' && (
            <ProcurementView
              products={products}
              purchaseRequests={purchaseRequests}
              purchaseOrders={purchaseOrders}
              goodsReceipts={goodsReceipts}
              hasPermission={hasPermission}
              onCreatePR={handleCreatePR}
              onSubmitPR={handleSubmitPR}
              onPRDecision={handlePRDecision}
              onCreateReceipt={handleCreateReceipt}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              stocks={stocks}
              movements={movements}
              warehouses={warehouses}
              products={products}
              hasPermission={hasPermission}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeTab === 'production' && (
            <ProductionView
              boms={boms}
              productionPlans={productionPlans}
              workOrders={workOrders}
              products={products}
              hasPermission={hasPermission}
              onCreatePlan={handleCreatePlan}
              onCreateWO={handleCreateWO}
              onIssueWOMaterials={handleIssueMaterials}
              onStartWOProduction={handleStartProduction}
              onReportYieldResult={handleReportResult}
            />
          )}

          {activeTab === 'quality' && (
            <QualityView
              inspections={inspections}
              goodsReceipts={goodsReceipts}
              workOrders={workOrders}
              hasPermission={hasPermission}
              onCreateInspection={handleCreateInspection}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              salesOrders={salesOrders}
              deliveries={deliveries}
              products={products}
              customers={customers}
              hasPermission={hasPermission}
              onCreateSO={handleCreateSalesOrder}
              onReserveSOStock={handleReserveStock}
              onDeliverSO={handleCreateDelivery}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              stocks={stocks}
              kpis={kpis}
              workOrders={workOrders}
              inspections={inspections}
              salesOrders={salesOrders}
              purchaseOrders={purchaseOrders}
            />
          )}

          {activeTab === 'admin' && <AdminView auditLogs={auditLogs} />}

          {/* Insufficient Stock Modal */}
          <Modal
            isOpen={showShortageModal}
            title={`Material Stock Shortage - ${shortageWO?.code || ''}`}
            onClose={() => setShowShortageModal(false)}
          >
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#EF4444', fontWeight: 600 }}>
                Cannot issue materials. Stock is insufficient for some components.
              </p>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Required Qty</th>
                      <th>Available Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortageItems.map((item, idx) => (
                      <tr
                        key={idx}
                        style={!item.isAvailable ? { backgroundColor: 'rgba(239, 68, 68, 0.08)' } : undefined}
                      >
                        <td style={{ fontWeight: 600 }}>
                          {item.code} <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '11px' }}>({item.name})</span>
                        </td>
                        <td>{item.requiredQty.toLocaleString()}</td>
                        <td style={!item.isAvailable ? { color: '#EF4444', fontWeight: 700 } : undefined}>
                          {item.availableQty.toLocaleString()}
                        </td>
                        <td>
                          {item.isAvailable ? (
                            <span className="badge badge-success">Sufficient</span>
                          ) : (
                            <span className="badge badge-danger">Short: {(item.requiredQty - item.availableQty).toLocaleString()}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '16px', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Next Steps:</span> Go to the <strong>Inventory</strong> tab and perform a <strong>Stock Adjustment</strong>, or create a <strong>Purchase Request</strong> for the missing components.
              </div>
            </div>
            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setShowShortageModal(false)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowShortageModal(false);
                  setActiveTab('inventory');
                }}
              >
                Adjust Stock
              </Button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}
