import React, { useRef, useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { jsPDF } from 'jspdf';
import {
  TrendingUp,
  Award,
  Download,
  Image,
  RefreshCw,
  ShoppingBag,
  Users,
  AlertTriangle,
  WalletCards,
  Sparkles
} from 'lucide-react';

const currency = (value = 0) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });

const drawOwnerReport = (metrics) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 1050;
  const context = canvas.getContext('2d');
  const kpis = metrics.kpis || {};
  const topProducts = metrics.topProducts || [];
  const trendOrders = metrics.trendOrders || [];
  const paymentMix = metrics.paymentMix || [];

  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0f172a';
  context.font = 'bold 34px Arial';
  context.fillText('KiranaFlow Owner Performance Dashboard', 50, 65);
  context.fillStyle = '#64748b';
  context.font = '18px Arial';
  context.fillText(`Generated ${new Date().toLocaleString()}`, 50, 98);

  const cards = [
    ['Revenue', `Rs. ${currency(kpis.totalRevenue)}`, `Today Rs. ${currency(kpis.todayRevenue)}`, '#ecfdf5', '#047857'],
    ['Estimated Profit', `Rs. ${currency(kpis.estimatedProfit)}`, 'Approx. 12% margin', '#eff6ff', '#0369a1'],
    ['Orders', String(kpis.totalOrders || 0), `Today ${kpis.todayOrders || 0}`, '#fff7ed', '#c2410c'],
    ['Pending Udhar', `Rs. ${currency(kpis.totalUdhar)}`, 'Credit outstanding', '#fffbeb', '#b45309']
  ];
  cards.forEach((card, index) => {
    const x = 50 + (index % 2) * 330;
    const y = 140 + Math.floor(index / 2) * 150;
    context.fillStyle = card[3];
    context.fillRect(x, y, 300, 120);
    context.fillStyle = card[4];
    context.font = 'bold 16px Arial';
    context.fillText(card[0].toUpperCase(), x + 20, y + 30);
    context.font = 'bold 28px Arial';
    context.fillText(card[1], x + 20, y + 70);
    context.font = '15px Arial';
    context.fillText(card[2], x + 20, y + 98);
  });

  context.fillStyle = '#ffffff';
  context.fillRect(50, 470, 620, 260);
  context.fillStyle = '#1e293b';
  context.font = 'bold 20px Arial';
  context.fillText('Revenue trend - last 7 days', 75, 505);
  const maxRevenue = Math.max(...trendOrders.map((day) => day.revenue || 0), 1);
  trendOrders.forEach((day, index) => {
    const barHeight = Math.max(((day.revenue || 0) / maxRevenue) * 150, 3);
    const x = 85 + index * 75;
    context.fillStyle = '#10b981';
    context.fillRect(x, 680 - barHeight, 42, barHeight);
    context.fillStyle = '#64748b';
    context.font = '12px Arial';
    context.fillText(day._id.slice(5), x, 705);
  });

  context.fillStyle = '#ffffff';
  context.fillRect(710, 470, 640, 260);
  context.fillStyle = '#1e293b';
  context.font = 'bold 20px Arial';
  context.fillText('Products creating most value', 735, 505);
  const maxSales = Math.max(...topProducts.map((product) => product.totalSales || 0), 1);
  topProducts.slice(0, 5).forEach((product, index) => {
    const y = 545 + index * 34;
    context.fillStyle = '#334155';
    context.font = 'bold 15px Arial';
    context.fillText(`${index + 1}. ${product._id}`, 735, y);
    context.fillStyle = '#10b981';
    context.fillRect(735, y + 8, 400 * ((product.totalSales || 0) / maxSales), 8);
    context.fillStyle = '#047857';
    context.font = 'bold 14px Arial';
    context.fillText(`Rs. ${currency(product.totalSales)}`, 1160, y);
  });

  context.fillStyle = '#ffffff';
  context.fillRect(50, 770, 1300, 210);
  context.fillStyle = '#1e293b';
  context.font = 'bold 20px Arial';
  context.fillText('Operational health and payment mix', 75, 805);
  context.font = '16px Arial';
  context.fillStyle = '#475569';
  context.fillText(`Active customers: ${kpis.activeCustomers || 0}`, 75, 850);
  context.fillText(`Low stock alerts: ${kpis.lowStockCount || 0}`, 350, 850);
  context.fillText(`Queue now: ${kpis.pendingOrders || 0}`, 625, 850);
  context.fillText(`Paid orders: ${kpis.paidOrders || 0}`, 850, 850);
  context.fillText(`Payment mix: ${paymentMix.map((payment) => `${payment._id || 'Pending'} Rs. ${currency(payment.value)}`).join(' | ') || 'No data'}`, 75, 910);
  return canvas;
};

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
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-3 w-40 bg-slate-200 rounded" />
              <div className="h-2.5 w-56 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="h-40 bg-slate-100 rounded-xl" />
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">Calculating store metrics…</p>
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
    if (exporting) return;
    setExporting(true);

    try {
      const canvas = drawOwnerReport(metrics);
      const imageData = canvas.toDataURL('image/png');

      if (format === 'image') {
        const link = document.createElement('a');
        link.download = 'kiranaflow-owner-report.png';
        link.href = imageData;
        link.click();
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const width = doc.internal.pageSize.getWidth() - 32;
      const height = (canvas.height * width) / canvas.width;
      doc.addImage(imageData, 'PNG', 16, 16, width, height);
      doc.save('kiranaflow-owner-report.pdf');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={reportRef} className="w-full bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              Owner Performance Dashboard
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500">The numbers that matter for today&apos;s decisions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button onClick={fetchMetrics} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-200 transition shadow-xs" title="Refresh report" aria-label="Refresh report">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => exportReport('image')} disabled={exporting} className="px-2.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition shadow-xs disabled:opacity-50" title="Download report image">
            <Image className="w-3.5 h-3.5" /> PNG
          </button>
          <button onClick={() => exportReport('pdf')} disabled={exporting} className="px-2.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:shadow-md hover:shadow-emerald-200 transition disabled:opacity-50" title="Download report PDF">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <div className="relative overflow-hidden p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl text-white shadow-md shadow-emerald-200/70 hover:-translate-y-0.5 hover:shadow-lg transition-all">
          <div className="absolute -right-5 -top-5 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-emerald-50 font-bold block">Revenue</span>
            <span className="text-lg font-black block">₹{currency(kpis.totalRevenue)}</span>
            <span className="text-[10px] text-emerald-100 block mt-1">Today ₹{currency(kpis.todayRevenue)}</span>
          </div>
        </div>
        <div className="relative overflow-hidden p-3.5 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl text-white shadow-md shadow-sky-200/70 hover:-translate-y-0.5 hover:shadow-lg transition-all">
          <div className="absolute -right-5 -top-5 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <WalletCards className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-sky-50 font-bold block">Est. Profit</span>
            <span className="text-lg font-black block">₹{currency(kpis.estimatedProfit)}</span>
            <span className="text-[10px] text-sky-100 block mt-1">Approx. 12% margin</span>
          </div>
        </div>
        <div className="relative overflow-hidden p-3.5 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl text-white shadow-md shadow-orange-200/70 hover:-translate-y-0.5 hover:shadow-lg transition-all">
          <div className="absolute -right-5 -top-5 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-orange-50 font-bold block">Orders</span>
            <span className="text-lg font-black block">{kpis.totalOrders || 0}</span>
            <span className="text-[10px] text-orange-100 block mt-1">Today {kpis.todayOrders || 0}</span>
          </div>
        </div>
        <div className="relative overflow-hidden p-3.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl text-white shadow-md shadow-amber-200/70 hover:-translate-y-0.5 hover:shadow-lg transition-all">
          <div className="absolute -right-5 -top-5 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-amber-50 font-bold block">Risk: Udhar</span>
            <span className="text-lg font-black block">₹{currency(kpis.totalUdhar)}</span>
            <span className="text-[10px] text-amber-100 block mt-1">Credit outstanding</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <section className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-sm transition-shadow">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Revenue trend · last 7 days</h4>
          <div className="h-36 flex items-end gap-1.5 border-b border-slate-100 pb-1">
            {trendOrders.length === 0 ? <span className="text-xs text-slate-400 self-center mx-auto">No order trend yet.</span> : trendOrders.map((day) => (
              <div key={day._id} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group" title={`${day._id}: ₹${currency(day.revenue)}`}>
                <div className="w-full max-w-8 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md min-h-1 group-hover:from-emerald-700 group-hover:to-emerald-500 transition-colors" style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 3)}%` }} />
                <span className="text-[9px] text-slate-400 group-hover:text-emerald-700 group-hover:font-bold transition-colors">{day._id.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-sky-200/80 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:shadow-sky-100 transition-all">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-sm shadow-sky-200">
              <TrendingUp className="w-4 h-4" />
            </span>
            Operational health
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-7 h-7 bg-slate-200/80 rounded-lg flex items-center justify-center mb-2"><Users className="w-3.5 h-3.5 text-slate-600" /></div>
              <span className="text-[10px] text-slate-500 block">Active customers</span><strong className="text-lg text-slate-900">{kpis.activeCustomers || 0}</strong>
            </div>
            <div className="p-3 bg-red-50 rounded-lg hover:bg-red-100/70 transition-colors">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center mb-2"><AlertTriangle className="w-3.5 h-3.5 text-red-600" /></div>
              <span className="text-[10px] text-red-600 block">Low stock alerts</span><strong className="text-lg text-red-900">{kpis.lowStockCount || 0}</strong>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100/70 transition-colors">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center mb-2"><ShoppingBag className="w-3.5 h-3.5 text-orange-600" /></div>
              <span className="text-[10px] text-orange-600 block">Queue now</span><strong className="text-lg text-orange-900">{kpis.pendingOrders || 0}</strong>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg hover:bg-sky-100/70 transition-colors">
              <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center mb-2"><WalletCards className="w-3.5 h-3.5 text-sky-600" /></div>
              <span className="text-[10px] text-sky-600 block">Paid orders</span><strong className="text-lg text-sky-900">{kpis.paidOrders || 0}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <section className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:shadow-amber-100 transition-all">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm shadow-amber-200">
              <Award className="w-4 h-4" />
            </span>
            Products creating most value
          </h4>

          {topProducts.length === 0 ? (
            <div className="relative overflow-hidden text-xs py-5 text-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 rounded-xl border border-amber-200">
              <div className="absolute -right-5 -top-6 w-20 h-20 rounded-full bg-amber-200/30" />
              <div className="relative">
                <Award className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="font-bold text-amber-900">No top sellers yet</p>
                <p className="text-[11px] text-amber-700/80 mt-0.5">Complete orders to see your best products.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((prod, idx) => (
                <div key={`${prod._id}-${idx}`} className="text-xs p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 font-black rounded-lg flex items-center justify-center text-[11px] shrink-0 ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-200' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate flex-1">{prod._id}</span>
                    <span className="font-extrabold text-emerald-700">₹{currency(prod.totalSales)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${(prod.totalSales / maxSales) * 100}%` }} /></div>
                  <span className="text-[10px] text-slate-400">{prod.totalQuantity || 0} units sold</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-violet-200/80 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:shadow-violet-100 transition-all">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-sm shadow-violet-200">
              <WalletCards className="w-4 h-4" />
            </span>
            Payment mix
          </h4>
          {paymentMix.length === 0 ? (
            <div className="relative overflow-hidden text-xs py-5 text-center bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 rounded-xl border border-violet-200">
              <div className="absolute -left-5 -bottom-7 w-20 h-20 rounded-full bg-violet-200/30" />
              <div className="relative">
                <WalletCards className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                <p className="font-bold text-violet-900">No payment data yet</p>
                <p className="text-[11px] text-violet-700/80 mt-0.5">Payment details will appear after sales.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const total = paymentMix.reduce((sum, p) => sum + (p.value || 0), 0) || 1;
                const dotColors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
                const barColors = ['from-emerald-400 to-emerald-600', 'from-sky-400 to-sky-600', 'from-amber-400 to-amber-600', 'from-violet-400 to-violet-600', 'from-rose-400 to-rose-600'];
                return paymentMix.map((payment, idx) => {
                  const pct = Math.round(((payment.value || 0) / total) * 100);
                  return (
                    <div key={payment._id || idx} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                          {payment._id || 'Pending'}
                        </span>
                        <span className="text-right"><strong className="text-slate-900">₹{currency(payment.value)}</strong><span className="text-slate-400 ml-1">· {payment.orders} orders</span></span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${barColors[idx % barColors.length]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};