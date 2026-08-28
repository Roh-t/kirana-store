import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { TrendingUp, IndianRupee, ShoppingBag, BookOpen, Award, ArrowUpRight } from 'lucide-react';

export const StoreAnalyticsDashboard = ({ storeId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardMetrics(storeId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
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
    return <div className="py-8 text-center text-xs text-stone-400">Calculating store metrics...</div>;
  }

  const kpis = data?.kpis || {};
  const topProducts = data?.topProducts || [];

  return (
    <div className="w-full bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Store Performance Analytics</h3>
            <p className="text-xs text-stone-500">Revenue, profit estimates, and top sellers</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <span className="text-xs text-emerald-800 font-bold block mb-1">Gross Revenue</span>
          <span className="text-xl font-black text-emerald-900">₹{kpis.totalRevenue}</span>
          <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">Today: ₹{kpis.todayRevenue}</span>
        </div>

        <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl">
          <span className="text-xs text-violet-800 font-bold block mb-1">Est. Gross Profit</span>
          <span className="text-xl font-black text-violet-900">₹{kpis.estimatedProfit}</span>
          <span className="text-[10px] text-violet-700 block mt-0.5 font-medium">~12% Kirana Margin</span>
        </div>

        <div className="p-3.5 bg-fuchsia-50/70 border border-fuchsia-200 rounded-xl">
          <span className="text-xs text-fuchsia-800 font-bold block mb-1">Total Orders</span>
          <span className="text-xl font-black text-fuchsia-900">{kpis.totalOrders}</span>
          <span className="text-[10px] text-fuchsia-700 block mt-0.5 font-medium">Today: {kpis.todayOrders} orders</span>
        </div>

        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
          <span className="text-xs text-amber-800 font-bold block mb-1">Pending Udhar</span>
          <span className="text-xl font-black text-amber-900">₹{kpis.totalUdhar}</span>
          <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">Market Credit</span>
        </div>
      </div>

      {/* Top Selling Products List */}
      <div>
        <h4 className="text-xs font-bold text-stone-800 mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-600" />
          Top Selling Kirana Items
        </h4>

        {topProducts.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center bg-amber-50 rounded-xl border border-dashed border-amber-200">
            Complete orders to view top sellers.
          </p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((prod, idx) => (
              <div key={idx} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white border border-amber-200 font-bold rounded-md flex items-center justify-center text-stone-700 text-[11px]">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-stone-900">{prod._id}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-700 block">₹{prod.totalSales}</span>
                  <span className="text-[10px] text-stone-400">{prod.totalQuantity} units sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};