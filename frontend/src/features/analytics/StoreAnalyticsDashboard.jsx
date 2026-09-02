import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { TrendingUp, Award } from 'lucide-react';

const currency = (value = 0) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });

export const StoreAnalyticsDashboard = ({ storeId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardMetrics(storeId);
      setData(res?.data || res || null);
    } catch (err) {
      console.error('Failed to load analytics', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchMetrics();
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
        <div className="py-8 text-center text-xs text-stone-400">Calculating store metrics...</div>
      </div>
    );
  }

  const metrics = data || {};
  const kpis = metrics.kpis || {};
  const topProducts = metrics.topProducts || [];

  return (
    <div className="w-full bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-stone-900">Store Performance Analytics</h3>
            <p className="text-xs text-stone-500">Revenue, profit estimates, and top sellers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <span className="text-[11px] uppercase tracking-wide text-emerald-800 font-bold block mb-1">Gross Revenue</span>
          <span className="text-xl font-black text-emerald-900">₹{currency(kpis.totalRevenue)}</span>
          <span className="text-[10px] text-emerald-700 block mt-1 font-medium">Today: ₹{currency(kpis.todayRevenue)}</span>
        </div>

        <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl">
          <span className="text-[11px] uppercase tracking-wide text-violet-800 font-bold block mb-1">Est. Gross Profit</span>
          <span className="text-xl font-black text-violet-900">₹{currency(kpis.estimatedProfit)}</span>
          <span className="text-[10px] text-violet-700 block mt-1 font-medium">~12% Kirana Margin</span>
        </div>

        <div className="p-3.5 bg-fuchsia-50/70 border border-fuchsia-200 rounded-xl">
          <span className="text-[11px] uppercase tracking-wide text-fuchsia-800 font-bold block mb-1">Total Orders</span>
          <span className="text-xl font-black text-fuchsia-900">{kpis.totalOrders || 0}</span>
          <span className="text-[10px] text-fuchsia-700 block mt-1 font-medium">Today: {kpis.todayOrders || 0} orders</span>
        </div>

        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
          <span className="text-[11px] uppercase tracking-wide text-amber-800 font-bold block mb-1">Pending Udhar</span>
          <span className="text-xl font-black text-amber-900">₹{currency(kpis.totalUdhar)}</span>
          <span className="text-[10px] text-amber-700 block mt-1 font-medium">Market Credit</span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-stone-800 mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-600" />
          Top Selling Kirana Items
        </h4>

        {topProducts.length === 0 ? (
          <div className="text-xs text-stone-400 py-4 text-center bg-amber-50 rounded-xl border border-dashed border-amber-200">
            Complete orders to view top sellers.
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((prod, idx) => (
              <div key={`${prod._id}-${idx}`} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 bg-white border border-amber-200 font-bold rounded-md flex items-center justify-center text-stone-700 text-[11px] shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-stone-900 truncate">{prod._id}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 block">₹{currency(prod.totalSales)}</span>
                  <span className="text-[10px] text-stone-400">{prod.totalQuantity || 0} units sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};