import React, { useState, useEffect, useRef } from 'react';
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
import { StoreTimingSettings } from './features/stores/StoreTimingSettings';
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
  ArrowUpRight,
  Bell,
  Sprout,
  CheckCircle2,
  AlertCircle
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

  // Notifications State & Dropdown Handlers
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Store Live', message: 'Your store is active and accepting orders online.', time: 'Just now', read: false },
    { id: 2, title: 'Welcome to KiranaFlow', message: '14-day Pro trial is currently active.', time: '1h ago', read: false }
  ]);

  const isSuperAdmin = user?.roles?.some((role) => (role.roleId?.name || role.roleId) === 'SUPER_ADMIN');
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-xs text-gray-500 mt-2">Loading KiranaFlow workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg sm:max-w-4xl flex flex-col items-center pb-20 sm:pb-6">
      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between py-1.5 px-0.5 mb-2.5 relative">
        {/* Brand Section */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
            <Sprout className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-none">
              Kirana<span className="text-emerald-700">Flow</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 mt-0.5">Simple Store Management</p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => {
              setIsCreatingNewBranch(false);
              setActiveTab('STORE');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-black shadow-xs transition active:scale-95"
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Store</span>
          </button>

          <button
            onClick={() => {
              if (activeStore?.slug) {
                window.open(`${window.location.origin}/s/${activeStore.slug}`, '_blank');
              }
            }}
            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95"
            title="Open customer storefront"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {/* Functional Notification Bell Button */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-2xs relative hover:bg-gray-50 transition active:scale-95"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-gray-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[9px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-xl text-left border ${
                        n.read ? 'bg-gray-50/50 border-gray-100' : 'bg-emerald-50/50 border-emerald-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-900">{n.title}</span>
                        <span className="text-[9px] text-gray-400">{n.time}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setIsCreatingNewBranch(false);
                setActiveTab('SUPER_ADMIN');
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition ${
                activeTab === 'SUPER_ADMIN' ? 'bg-purple-700 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              Admin
            </button>
          )}

          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
            title="Logout Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

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
        <div className="w-full space-y-3">
          {/* Desktop Tab Bar */}
          <div className="hidden sm:flex gap-1 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setStoreModuleTab('HOME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'HOME' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>
            <button
              onClick={() => setStoreModuleTab('QUEUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'QUEUE' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Queue
            </button>
            <button
              onClick={() => setStoreModuleTab('CATALOG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'CATALOG' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Catalog
            </button>
            <button
              onClick={() => setStoreModuleTab('INVENTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'INVENTORY' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              Stock
            </button>
            <button
              onClick={() => setStoreModuleTab('CUSTOMERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'CUSTOMERS' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Udhar
            </button>
            <button
              onClick={() => setStoreModuleTab('ANALYTICS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'ANALYTICS' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Reports
            </button>
            <button
              onClick={() => setStoreModuleTab('SETTINGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                storeModuleTab === 'SETTINGS' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>

          {/* Sub Views */}
          {storeModuleTab === 'HOME' && (
            <div className="space-y-3">
              <StoreDashboardHeader
                store={activeStore}
                stores={stores}
                onStoreSwitched={(switchedStore) => setActiveStore(switchedStore)}
                onOpenCreateStore={() => setIsCreatingNewBranch(true)}
              />
              <SubscriptionBanner storeId={activeStore._id} />
            </div>
          )}

          {storeModuleTab === 'QUEUE' && <OrderQueueDashboard storeId={activeStore._id} store={activeStore} />}

          {storeModuleTab === 'CATALOG' && (
            <div className="space-y-4">
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
            <div className="space-y-4">
              <StoreTimingSettings
                store={activeStore}
                onStoreUpdated={(updatedStore) => setActiveStore(updatedStore)}
              />
              <StaffManager storeId={activeStore._id} />
              <AuditLogViewer storeId={activeStore._id} />
            </div>
          )}

          {/* Compact Floating Mobile Bottom Navigation */}
          <nav className="sm:hidden fixed bottom-2.5 left-1/2 -translate-x-1/2 w-[94%] max-w-sm bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl px-2 py-1.5 z-40 flex items-center justify-around shadow-[0_8px_25px_rgba(0,0,0,0.08)]">
            <button
              onClick={() => setStoreModuleTab('HOME')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'HOME' ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Home</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('QUEUE')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'QUEUE' ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Orders</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('CATALOG')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'CATALOG' ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Catalog</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('INVENTORY')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'INVENTORY' ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Stock</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('CUSTOMERS')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'CUSTOMERS' ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Udhar</span>
            </button>

            <button
              onClick={() => setStoreModuleTab('ANALYTICS')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                storeModuleTab === 'ANALYTICS' ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-400 font-medium'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Reports</span>
            </button>
          </nav>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50/60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]/90 flex flex-col items-center justify-start p-2.5 sm:p-4">
      <main className="w-full max-w-lg flex flex-col items-center gap-3">
        {isAuthenticated ? (
          <DashboardView />
        ) : view === 'login' ? (
          <LoginPage onSwitchToRegister={() => setView('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setView('login')} />
        )}

        <div className="mt-1 w-full max-w-sm">
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