import React, { useRef, useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  TrendingUp,
  Award,
  Download,
  Image,
  RefreshCw,
  ShoppingBag,
  Users,
  AlertTriangle,
  WalletCards
} from 'lucide-react';

const currency = (value = 0) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });

export const StoreAnalyticsDashboard = ({ storeId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

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
  const trendOrders = metrics.trendOrders || [];
  const paymentMix = metrics.paymentMix || [];
  const maxRevenue = Math.max(...trendOrders.map((day) => day.revenue || 0), 1);
  const maxSales = Math.max(...topProducts.map((product) => product.totalSales || 0), 1);

  const exportReport = async (format) => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#ffffff', scale: 2 });
      if (format === 'image') {
        const link = document.createElement('a');
        link.download = 'kiranaflow-owner-report.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const width = doc.internal.pageSize.getWidth() - 32;
      const height = (canvas.height * width) / canvas.width;
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 16, 16, width, height);
      doc.save('kiranaflow-owner-report.pdf');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={reportRef} className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Owner Performance Dashboard</h3>
            <p className="text-xs text-slate-500">The numbers that matter for today&apos;s decisions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={fetchMetrics} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100" title="Refresh report" aria-label="Refresh report">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => exportReport('image')} disabled={exporting} className="px-2.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50" title="Download report image">
            <Image className="w-3.5 h-3.5" /> PNG
          </button>
          <button onClick={() => exportReport('pdf')} disabled={exporting} className="px-2.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50" title="Download report PDF">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <TrendingUp className="w-4 h-4 text-emerald-700 mb-2" />
          <span className="text-[10px] uppercase tracking-wide text-emerald-800 font-bold block">Revenue</span>
          <span className="text-lg font-black text-emerald-900">₹{currency(kpis.totalRevenue)}</span>
          <span className="text-[10px] text-emerald-700 block mt-1">Today ₹{currency(kpis.todayRevenue)}</span>
        </div>
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl">
          <WalletCards className="w-4 h-4 text-sky-700 mb-2" />
          <span className="text-[10px] uppercase tracking-wide text-sky-800 font-bold block">Est. Profit</span>
          <span className="text-lg font-black text-sky-900">₹{currency(kpis.estimatedProfit)}</span>
          <span className="text-[10px] text-sky-700 block mt-1">Approx. 12% margin</span>
        </div>
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
          <ShoppingBag className="w-4 h-4 text-orange-700 mb-2" />
          <span className="text-[10px] uppercase tracking-wide text-orange-800 font-bold block">Orders</span>
          <span className="text-lg font-black text-orange-900">{kpis.totalOrders || 0}</span>
          <span className="text-[10px] text-orange-700 block mt-1">Today {kpis.todayOrders || 0}</span>
        </div>
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-700 mb-2" />
          <span className="text-[10px] uppercase tracking-wide text-amber-800 font-bold block">Risk: Udhar</span>
          <span className="text-lg font-black text-amber-900">₹{currency(kpis.totalUdhar)}</span>
          <span className="text-[10px] text-amber-700 block mt-1">Credit outstanding</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <section className="bg-white border border-slate-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-slate-800 mb-3">Revenue trend · last 7 days</h4>
          <div className="h-36 flex items-end gap-1.5 border-b border-slate-100 pb-1">
            {trendOrders.length === 0 ? <span className="text-xs text-slate-400 self-center mx-auto">No order trend yet.</span> : trendOrders.map((day) => (
              <div key={day._id} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${day._id}: ₹${currency(day.revenue)}`}>
                <div className="w-full max-w-8 bg-emerald-500 rounded-t-md min-h-1" style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 3)}%` }} />
                <span className="text-[9px] text-slate-400">{day._id.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-slate-800 mb-3">Operational health</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 rounded-lg"><Users className="w-4 h-4 text-slate-500 mb-2" /><span className="text-[10px] text-slate-500 block">Active customers</span><strong className="text-lg text-slate-900">{kpis.activeCustomers || 0}</strong></div>
            <div className="p-3 bg-red-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-500 mb-2" /><span className="text-[10px] text-red-600 block">Low stock alerts</span><strong className="text-lg text-red-900">{kpis.lowStockCount || 0}</strong></div>
            <div className="p-3 bg-orange-50 rounded-lg"><ShoppingBag className="w-4 h-4 text-orange-500 mb-2" /><span className="text-[10px] text-orange-600 block">Queue now</span><strong className="text-lg text-orange-900">{kpis.pendingOrders || 0}</strong></div>
            <div className="p-3 bg-sky-50 rounded-lg"><WalletCards className="w-4 h-4 text-sky-500 mb-2" /><span className="text-[10px] text-sky-600 block">Paid orders</span><strong className="text-lg text-sky-900">{kpis.paidOrders || 0}</strong></div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <section className="bg-white border border-slate-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-600" /> Products creating most value</h4>

        {topProducts.length === 0 ? (
          <div className="text-xs text-stone-400 py-4 text-center bg-amber-50 rounded-xl border border-dashed border-amber-200">
            Complete orders to view top sellers.
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((prod, idx) => (
              <div key={`${prod._id}-${idx}`} className="text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 bg-amber-50 border border-amber-200 font-bold rounded-md flex items-center justify-center text-stone-700 text-[11px] shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 truncate flex-1">{prod._id}</span>
                  <span className="font-extrabold text-emerald-700">₹{currency(prod.totalSales)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-1.5"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(prod.totalSales / maxSales) * 100}%` }} /></div>
                <span className="text-[10px] text-slate-400">{prod.totalQuantity || 0} units sold</span>
              </div>
            ))}
          </div>
        )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-slate-800 mb-3">Payment mix</h4>
          {paymentMix.length === 0 ? <p className="text-xs text-slate-400">No payment data yet.</p> : paymentMix.map((payment) => (
            <div key={payment._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
              <span className="font-bold text-slate-700">{payment._id || 'Pending'}</span>
              <span className="text-right"><strong className="text-slate-900">₹{currency(payment.value)}</strong><small className="block text-slate-400">{payment.orders} orders</small></span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};