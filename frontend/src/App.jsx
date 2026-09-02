import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { CreateStoreModal } from './features/stores/CreateStoreModal';
import { StoreDashboardHeader } from './features/stores/StoreDashboardHeader';
import { SubscriptionBanner } from './features/subscriptions/SubscriptionBanner';
import { OrderQueueDashboard } from './features/orders/OrderQueueDashboard';
import { CategoryManager } from './features/categories/CategoryManager';
import { ProductManager } from './features/products/ProductManager';
import { InventoryManager } from './features/inventory/InventoryManager';
import { CustomerManager } from './features/customers/CustomerManager';
import { StoreAnalyticsDashboard } from './features/analytics/StoreAnalyticsDashboard';
import { StaffManager } from './features/stores/StaffManager';
import { AuditLogViewer } from './features/auditLogs/AuditLogViewer';
import { SuperAdminDashboard } from './features/admin/SuperAdminDashboard';
import { PublicStorefront } from './features/publicStore/PublicStorefront';
import { HealthBadge } from './components/common/HealthBadge';
import { InstallPwaBanner } from './components/common/InstallPwaBanner';
import { storeService } from './services/storeService';
import {
  LogOut,
  ShieldCheck,
  Store as StoreIcon,
  Home,
  ShoppingBag,
  Package,
  Warehouse,
  Users,
  TrendingUp,
  Settings,
  ArrowUpRight
} from 'lucide-react';

function DashboardView() {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [activeTab, setActiveTab] = useState('STORE');
  const [storeModuleTab, setStoreModuleTab] = useState('HOME');
  const [isCreatingNewBranch, setIsCreatingNewBranch] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = user?.roles?.some((role) => (role.roleId?.name || role.roleId) === 'SUPER_ADMIN');

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await storeService.getMyStores();
      setStores(res.data);
      if (res.data.length > 0 && !activeStore) {
        setActiveStore(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-xs text-gray-500 mt-2">Loading KiranaFlow workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center pb-20 sm:pb-6">
      {/* Top Navbar */}
      <div className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-[22px] p-2.5 mb-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <h1 className="text-[2rem] sm:text-[2.2rem] font-black leading-none tracking-[-0.06em] text-green-700">KiranaFlow</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsCreatingNewBranch(false);
              setActiveTab('STORE');
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold transition ${
              activeTab === 'STORE' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            Store
          </button>

          <button
            onClick={() => {
              setIsCreatingNewBranch(false);
              setActiveTab('STORE');
            }}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 transition"
            title="Open store workspace"
            aria-label="Open store workspace"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setIsCreatingNewBranch(false);
                setActiveTab('SUPER_ADMIN');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                activeTab === 'SUPER_ADMIN' ? 'bg-purple-700 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              SuperAdmin
            </button>
          )}

          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
            title="Logout Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'SUPER_ADMIN' && isSuperAdmin ? (
        <SuperAdminDashboard />
      ) : isCreatingNewBranch || !activeStore ? (
        <CreateStoreModal
          onStoreCreated={(newStore) => {
            setActiveStore(newStore);
            setIsCreatingNewBranch(false);
            fetchStores();
          }}
        />
      ) : (
        <div className="w-full space-y-4">
          {/* Segmented Navigation Tabs */}
          <div className="hidden sm:flex gap-1.5 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setStoreModuleTab('HOME')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'HOME' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={() => setStoreModuleTab('QUEUE')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'QUEUE' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Live Queue
            </button>

            <button
              onClick={() => setStoreModuleTab('CATALOG')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'CATALOG' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              Catalog
            </button>

            <button
              onClick={() => setStoreModuleTab('INVENTORY')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'INVENTORY' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              Stock
            </button>

            <button
              onClick={() => setStoreModuleTab('CUSTOMERS')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'CUSTOMERS' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Udhar
            </button>

            <button
              onClick={() => setStoreModuleTab('ANALYTICS')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'ANALYTICS' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Reports
            </button>

            <button
              onClick={() => setStoreModuleTab('SETTINGS')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'SETTINGS' ? 'bg-green-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Staff & Audit
            </button>
          </div>

          {/* Module Views */}
          {storeModuleTab === 'HOME' && (
            <div className="space-y-4">
              <StoreDashboardHeader
                store={activeStore}
                stores={stores}
                onStoreSwitched={(switchedStore) => setActiveStore(switchedStore)}
                onOpenCreateStore={() => setIsCreatingNewBranch(true)}
              />
              <SubscriptionBanner storeId={activeStore._id} />
            </div>
          )}

          {storeModuleTab === 'QUEUE' && <OrderQueueDashboard storeId={activeStore._id} />}

          {storeModuleTab === 'CATALOG' && (
            <div className="space-y-6">
              <CategoryManager
                storeId={activeStore._id}
                onCategoryChanged={() => setCatalogVersion((v) => v + 1)}
              />
              <ProductManager storeId={activeStore._id} catalogVersion={catalogVersion} />
            </div>
          )}

          {storeModuleTab === 'INVENTORY' && <InventoryManager storeId={activeStore._id} />}

          {storeModuleTab === 'CUSTOMERS' && <CustomerManager storeId={activeStore._id} />}

          {storeModuleTab === 'ANALYTICS' && <StoreAnalyticsDashboard storeId={activeStore._id} />}

          {storeModuleTab === 'SETTINGS' && (
            <div className="space-y-6">
              <StaffManager storeId={activeStore._id} />
              <AuditLogViewer storeId={activeStore._id} />
            </div>
          )}

          {/* Fixed Mobile Bottom Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1.5 z-40 flex items-center justify-around shadow-xl">
            <button
              onClick={() => setStoreModuleTab('HOME')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'HOME' ? 'text-green-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Home</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('QUEUE')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'QUEUE' ? 'text-green-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Orders</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('CATALOG')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'CATALOG' ? 'text-green-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Catalog</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('INVENTORY')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'INVENTORY' ? 'text-green-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Warehouse className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Stock</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('CUSTOMERS')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'CUSTOMERS' ? 'text-green-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Udhar</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('ANALYTICS')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'ANALYTICS' ? 'text-green-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Reports</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [view, setView] = useState('login');

  const path = window.location.pathname;
  const isPublicStoreRoute = path.startsWith('/s/');
  const storeSlug = isPublicStoreRoute ? path.split('/s/')[1] : null;

  if (isPublicStoreRoute && storeSlug) {
    return (
      <CartProvider slug={storeSlug}>
        <PublicStorefront slug={storeSlug} />
        <InstallPwaBanner />
      </CartProvider>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-3 sm:p-4">
      <main className="w-full max-w-4xl flex flex-col items-center gap-4">
        {isAuthenticated ? (
          <DashboardView />
        ) : view === 'login' ? (
          <LoginPage onSwitchToRegister={() => setView('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setView('login')} />
        )}

        <div className="mt-2 w-full max-w-md">
          <HealthBadge />
        </div>

        <InstallPwaBanner />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}