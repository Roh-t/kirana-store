import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ShieldCheck, Store, Users, ShoppingBag, Search, Power } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metRes, storeRes] = await Promise.all([
        adminService.getMetrics(),
        adminService.getAllStores({ search })
      ]);
      setMetrics(metRes.data);
      setStores(storeRes.data);
    } catch (err) {
      console.error('Failed to load SuperAdmin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleToggleStatus = async (storeId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (window.confirm(`Are you sure you want to change store status to ${nextStatus}?`)) {
      try {
        await adminService.toggleStoreStatus(storeId, nextStatus);
        fetchData();
      } catch (err) {
        alert(err.message || 'Failed to update store status');
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">KiranaFlow SaaS SuperAdmin Dashboard</h3>
            <p className="text-xs text-gray-500">Global SaaS tenant metrics and store directory</p>
          </div>
        </div>
      </div>

      {/* Global SaaS KPIs */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
            <span className="text-xs text-purple-800 font-bold block mb-1">Total SaaS Stores</span>
            <span className="text-xl font-black text-purple-900">{metrics.totalStores}</span>
            <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">{metrics.activeStores} Active</span>
          </div>

          <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-xs text-green-800 font-bold block mb-1">Total Platform GMV</span>
            <span className="text-xl font-black text-green-900">₹{metrics.totalGmv}</span>
            <span className="text-[10px] text-green-700 block mt-0.5 font-medium">All Stores Volume</span>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-xs text-blue-800 font-bold block mb-1">Processed Orders</span>
            <span className="text-xl font-black text-blue-900">{metrics.totalOrders}</span>
            <span className="text-[10px] text-blue-700 block mt-0.5 font-medium">System Total</span>
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-xs text-gray-700 font-bold block mb-1">Registered Users</span>
            <span className="text-xl font-black text-gray-900">{metrics.totalUsers}</span>
            <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">Shopkeepers & Staff</span>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search SaaS tenant by store name, slug, or mobile number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* All Stores Directory Table */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading platform stores...</div>
      ) : stores.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-xs text-gray-500 font-medium">No stores registered yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
          {stores.map((s) => (
            <div key={s._id} className="p-3.5 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{s.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {s.slug}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Owner: {s.ownerId?.name || 'N/A'} ({s.phone}) • {s.address?.city}, {s.address?.state}
                </p>
              </div>

              <button
                onClick={() => handleToggleStatus(s._id, s.status)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                  s.status === 'ACTIVE'
                    ? 'text-red-600 border-red-200 hover:bg-red-50'
                    : 'text-green-700 border-green-200 hover:bg-green-50'
                }`}
                title={s.status === 'ACTIVE' ? 'Suspend Store Tenant' : 'Activate Store Tenant'}
              >
                <Power className="w-4 h-4" />
                {s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};