import React, { useState, useEffect, useRef } from 'react';
import { orderService } from '../../services/orderService';
import { billingService } from '../../services/billingService';
import { whatsappService } from '../../services/whatsappService';
import { downloadOrderPdf } from '../../utils/pdfDownloader';
import { InvoiceReceiptModal } from '../billing/InvoiceReceiptModal';
import { PaymentModal } from '../payments/PaymentModal';
import { OrderPdfModal } from '../../components/common/OrderPdfModal';
import {
  ShoppingBag,
  BellRing,
  Clock,
  CheckCircle,
  PackageCheck,
  CheckCheck,
  XCircle,
  RefreshCw,
  Eye,
  User,
  MapPin,
  Receipt,
  QrCode,
  MessageSquare,
  Trash2,
  FileText,
  CalendarRange
  ,   ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  PhoneCall
} from 'lucide-react';

const dateKey = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatOrderDate = (value) => {
  const d = new Date(value);
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatOrderTime = (value) => {
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDateRange = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
};

export const OrderQueueDashboard = ({ storeId, store }) => {
  const [orders, setOrders] = useState([]);
  const [statusSummary, setStatusSummary] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState(() => dateKey(new Date()));
  const [availableDates, setAvailableDates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [moreMenuOrderId, setMoreMenuOrderId] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  const [dateStats, setDateStats] = useState({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const filteredOrders = orders;

  const prevPendingCount = useRef(0);

  const playChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {}
  };

  const fetchQueue = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const { dateFrom, dateTo } = getDateRange(selectedDateFilter);
      const queueParams = {
        status: selectedStatus,
        page: currentPage,
        limit: 10,
        dateFrom,
        dateTo
      };
      const [res, summaryRes, allDatesRes] = await Promise.all([
        orderService.getOrderQueue(storeId, queueParams),
        orderService.getOrderQueue(storeId, { status: 'ALL', page: 1, limit: 100, dateFrom, dateTo }),
        orderService.getOrderQueue(storeId, { status: 'ALL', page: 1, limit: 200 })
      ]);
      const queueOrders = Array.isArray(res.data) ? res.data : [];
      setOrders(queueOrders);
      setPagination(res.pagination || { currentPage, totalPages: 1, totalRecords: queueOrders.length });

      const responseSummary = summaryRes.meta?.statusSummary || res.meta?.statusSummary;
      const summaryOrders = Array.isArray(summaryRes.data) ? summaryRes.data : [];
      const allOrders = Array.isArray(allDatesRes.data) ? allDatesRes.data : [];
      const todayKey = dateKey(new Date());
      const orderDates = allOrders
        .map((order) => order?.createdAt && dateKey(order.createdAt))
        .filter((value) => value && value <= todayKey);
      setAvailableDates([...new Set([todayKey, ...orderDates])].sort().reverse());

      const perDateStats = allOrders.reduce((stats, order) => {
        if (!order?.createdAt) return stats;
        const key = dateKey(order.createdAt);
        if (!stats[key]) stats[key] = { total: 0, pending: 0 };
        stats[key].total += 1;
        if (order.orderStatus === 'PENDING') stats[key].pending += 1;
        return stats;
      }, {});
      setDateStats(perDateStats);

      const fallbackSummary = summaryOrders.reduce((counts, order) => {
        if (order.orderStatus) counts[order.orderStatus] = (counts[order.orderStatus] || 0) + 1;
        return counts;
      }, {});
      const hasPositiveSummary = responseSummary && Object.values(responseSummary).some((count) => Number(count) > 0);
      const summary = hasPositiveSummary ? responseSummary : fallbackSummary;

      if (summary) {
        setStatusSummary(summary);
        if (summary.PENDING > prevPendingCount.current && prevPendingCount.current >= 0) {
          playChimeSound();
        }
        prevPendingCount.current = summary.PENDING;
      }
    } catch (err) {
      console.error('Failed to load live order queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchQueue(true);
    }
  }, [storeId, selectedStatus, currentPage, selectedDateFilter]);

  useEffect(() => {
    if (!autoRefresh || !storeId) return;
    const interval = setInterval(() => {
      fetchQueue(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, storeId, selectedStatus, currentPage, selectedDateFilter]);

  const changeStatus = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const changeDate = (value) => {
    setSelectedDateFilter(value);
    setCurrentPage(1);
    setCalendarOpen(false);
  };

  const todayKey = dateKey(new Date());
  const recentDates = availableDates.filter((value) => value !== todayKey).slice(0, 6);
  const calendarDaysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarStartDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const calendarDays = Array.from({ length: calendarStartDay + calendarDaysInMonth }, (_, index) => {
    if (index < calendarStartDay) return null;
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - calendarStartDay + 1);
  });

  const handleStatusUpdate = async (orderId, nextStatus) => {
    try {
      await orderService.updateOrderStatus(storeId, orderId, nextStatus);
      fetchQueue(false);
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleRemoveShortageItem = async (order, itemToRemove) => {
    if (order.items.length <= 1) {
      alert('Order must contain at least one item. If all items are out of stock, please cancel the order.');
      return;
    }

    if (window.confirm(`Mark "${itemToRemove.nameSnapshot}" as OUT OF STOCK and remove from order?`)) {
      try {
        const updatedItems = order.items
          .filter((i) => i.productId !== itemToRemove.productId)
          .map((i) => ({ productId: i.productId, quantity: i.quantity }));

        await orderService.modifyOrderItems(
          storeId,
          order._id,
          updatedItems,
          `${itemToRemove.nameSnapshot} Out of Stock`
        );
        fetchQueue(false);
      } catch (err) {
        alert(err.message || 'Failed to modify order items');
      }
    }
  };

  const handleGenerateBill = async (orderId) => {
    try {
      const res = await billingService.generateInvoice(storeId, orderId, 'CASH');
      setInvoiceData(res.data);
      fetchQueue(false);
    } catch (err) {
      alert(err.message || 'Failed to generate tax invoice');
    }
  };

  const handleSendWhatsAppUpdate = async (orderId) => {
    try {
      const res = await whatsappService.getOrderWhatsAppLink(storeId, orderId);
      window.open(res.data.whatsappUrl, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to generate WhatsApp link');
    }
  };

  const handleDirectPdfDownload = async (order) => {
    try {
      await downloadOrderPdf(order, order.storeId);
    } catch (err) {
      alert('Failed to download PDF bill');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3.5">
      {/* Queue Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Live Orders</h3>
            <p className="text-[11px] text-gray-500">Counter Queue & Processing</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition ${
              autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            <BellRing className={`w-3 h-3 ${autoRefresh ? 'animate-bounce text-green-600' : ''}`} />
            {autoRefresh ? 'Sync (5s)' : 'Paused'}
          </button>
          <button
            onClick={() => fetchQueue(true)}
            className="p-1.5 bg-gray-100 active:bg-gray-200 rounded-lg text-gray-700"
            title="Refresh Order Queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-1">
        {[
          { key: 'ALL', label: 'All', count: Object.values(statusSummary).reduce((a, b) => a + b, 0) },
          { key: 'PENDING', label: 'Incoming', count: statusSummary.PENDING || 0, badgeBg: 'bg-red-500 text-white' },
          { key: 'ACCEPTED', label: 'Accepted', count: statusSummary.ACCEPTED || 0 },
          { key: 'PACKING', label: 'Packing', count: statusSummary.PACKING || 0 },
          { key: 'READY', label: 'Ready', count: statusSummary.READY || 0 },
          { key: 'COMPLETED', label: 'Completed', count: statusSummary.COMPLETED || 0 }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 active:scale-95 ${
              selectedStatus === tab.key
                ? 'bg-green-700 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className="font-black opacity-80">· {tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Order history dates">
        <button
          type="button"
          onClick={() => changeDate(todayKey)}
          className={`min-w-[82px] rounded-xl border px-2.5 py-2 text-center transition active:scale-95 ${
            selectedDateFilter === todayKey
              ? 'border-green-700 bg-green-700 text-white shadow-2xs'
              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="block text-[10px] font-bold uppercase">Today</span>
          <span className="block text-xs font-black">
            {new Date(`${todayKey}T00:00:00`).toLocaleDateString([], { day: '2-digit', month: 'short' })}
          </span>
          <span className="mt-1 flex items-center justify-center gap-1">
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
              selectedDateFilter === todayKey ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {(dateStats[todayKey] || { total: 0 }).total}
            </span>
            {(dateStats[todayKey] || { pending: 0 }).pending > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                {(dateStats[todayKey] || { pending: 0 }).pending}
              </span>
            )}
          </span>
        </button>

        {recentDates.map((value) => {
          const date = new Date(`${value}T00:00:00`);
          const isSelected = selectedDateFilter === value;
          const stats = dateStats[value] || { total: 0, pending: 0 };
          return (
            <button
              key={value}
              type="button"
              onClick={() => changeDate(value)}
              className={`min-w-[82px] rounded-xl border px-2.5 py-2 text-center transition active:scale-95 ${
                isSelected
                  ? 'border-green-700 bg-green-700 text-white shadow-2xs'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase">{date.toLocaleDateString([], { weekday: 'short' })}</span>
              <span className="block text-xs font-black">{date.toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
              <span className="mt-1 flex items-center justify-center gap-1">
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}
                  title="Total orders"
                >
                  {stats.total}
                </span>
                {stats.pending > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                      isSelected ? 'bg-red-400 text-white' : 'bg-red-500 text-white'
                    }`}
                    title="Pending / incoming orders"
                  >
                    {stats.pending}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setCalendarMonth(new Date(`${selectedDateFilter}T00:00:00`));
              setCalendarOpen((open) => !open);
            }}
            className="flex h-[54px] min-w-[46px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
            title="Choose another date"
            aria-label="Choose order history date"
            aria-expanded={calendarOpen}
          >
            <CalendarRange className="h-4 w-4" />
          </button>

          {calendarOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-[272px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-extrabold text-gray-800">
                  {calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() === new Date().getMonth()}
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`empty-${index}`} className="h-9" />;
                  const value = dateKey(date);
                  const stats = dateStats[value] || { total: 0, pending: 0 };
                  const isFuture = value > todayKey;
                  const isSelected = value === selectedDateFilter;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isFuture}
                      onClick={() => changeDate(value)}
                      className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-[11px] font-bold transition ${
                        isSelected ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-green-50'
                      } ${isFuture ? 'cursor-not-allowed text-gray-300 hover:bg-transparent' : ''}`}
                    >
                      <span>{date.getDate()}</span>
                      <span className="flex h-1.5 items-center gap-0.5">
                        {stats.total > 0 && <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                        {stats.pending > 0 && <span className="h-1 w-1 rounded-full bg-red-500" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 border-t border-gray-100 pt-2 text-[9px] font-semibold text-gray-500">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Total orders</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Pending</span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Order Cards */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 font-bold">Syncing live queue...</div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <Clock className="w-7 h-7 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-bold">No orders in this state</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-8 text-center bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-dashed border-emerald-200 p-4">
          <Clock className="w-7 h-7 text-emerald-300 mx-auto mb-1" />
          <p className="text-xs text-gray-600 font-bold">No orders found for this date filter</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const isPending = order.orderStatus === 'PENDING';
            const isModifiable = ['PENDING', 'ACCEPTED', 'PACKING'].includes(order.orderStatus);
            const isExpanded = expandedOrderId === order._id;
            const orderDate = formatOrderDate(order.createdAt);
            const orderTime = formatOrderTime(order.createdAt);

            return (
              <div
                key={order._id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isPending
                    ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50 border-amber-300 shadow-[0_4px_14px_rgba(245,158,11,0.08)]'
                    : 'bg-gradient-to-br from-white via-white to-emerald-50/30 border-gray-200/90 shadow-[0_4px_14px_rgba(15,23,42,0.03)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                  className="w-full text-left p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-black text-xs sm:text-sm text-gray-900 truncate">{order.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                        {order.orderType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          order.orderStatus === 'PENDING'
                            ? 'bg-red-500 text-white animate-pulse'
                            : order.orderStatus === 'ACCEPTED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.orderStatus === 'PACKING'
                            ? 'bg-violet-100 text-violet-800'
                            : order.orderStatus === 'READY'
                            ? 'bg-amber-100 text-amber-800'
                            : order.orderStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">{isExpanded ? 'Hide' : 'View'}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                    <div className="flex min-w-0 items-center gap-1.5 text-gray-900">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-semibold">{order.customerDetails.name}</span>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>{orderDate}</span>
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600">{orderTime}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-700">
                    <div className="min-w-0 text-gray-600">
                      {!isExpanded && (
                        <span className="truncate block">
                          {order.items.slice(0, 2).map((item) => `${item.quantity}x ${item.nameSnapshot}`).join(' • ')}
                          {order.items.length > 2 ? ' • +' + (order.items.length - 2) + ' more' : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-emerald-700 whitespace-nowrap">₹{order.grandTotal}</div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-0 -mt-1">
                    {/* Contact row — phone only (name already shown above), tap-to-call */}
                    <div className="text-xs text-gray-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={`tel:${order.customerDetails.phone}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-mono text-emerald-700 flex items-center gap-1 underline decoration-emerald-300 underline-offset-2"
                        title="Call customer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        {order.customerDetails.phone}
                      </a>
                      {order.customerDetails.deliveryAddress && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {order.customerDetails.deliveryAddress}
                        </span>
                      )}
                    </div>

                    {/* Item list — no seam, right-aligned prices, edit moved out of inline delete */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Items</span>
                        {isModifiable && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditOrderId(editOrderId === order._id ? null : order._id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            <Pencil className="w-3 h-3" />
                            {editOrderId === order._id ? 'Done' : 'Edit order'}
                          </button>
                        )}
                      </div>
                      <div className="text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-700 pr-2 truncate">
                              {item.quantity}x {item.nameSnapshot} ({item.unitSnapshot})
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-gray-900 text-right tabular-nums w-16">₹{item.lineGrandTotal}</span>
                              {isModifiable && editOrderId === order._id && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleRemoveShortageItem(order, item);
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Mark item as Out of Stock"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Subtotal directly under item list, right-aligned */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Payable Total</span>
                        <span className="text-sm font-black text-green-700 w-16 text-right tabular-nums">₹{order.grandTotal}</span>
                      </div>
                    </div>

                    {/* Primary action row */}
                    <div className="mt-3 flex items-center gap-2">
                      {order.orderStatus === 'PENDING' && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStatusUpdate(order._id, 'ACCEPTED');
                          }}
                          className="flex-1 py-2.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept Order
                        </button>
                      )}

                      {order.orderStatus === 'ACCEPTED' && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStatusUpdate(order._id, 'PACKING');
                          }}
                          className="flex-1 py-2.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <PackageCheck className="w-4 h-4" />
                          Start Packing
                        </button>
                      )}

                      {order.orderStatus === 'PACKING' && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStatusUpdate(order._id, 'READY');
                          }}
                          className="flex-1 py-2.5 bg-purple-600 active:bg-purple-700 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <CheckCheck className="w-4 h-4" />
                          Mark Ready
                        </button>
                      )}

                      {order.orderStatus === 'READY' && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStatusUpdate(order._id, 'COMPLETED');
                          }}
                          className="flex-1 py-2.5 bg-green-700 active:bg-green-800 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete Order
                        </button>
                      )}

                      {order.paymentStatus !== 'PAID' && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setPaymentOrder(order);
                          }}
                          className="px-3 py-2.5 bg-white text-green-700 border border-green-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
                          title="Show payment QR code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Show QR
                        </button>
                      )}

                      {/* More menu — secondary utility actions, tucked away from primary action */}
                      <div className="relative shrink-0">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setMoreMenuOrderId(moreMenuOrderId === order._id ? null : order._id);
                          }}
                          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition border border-gray-200"
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {moreMenuOrderId === order._id && (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className="absolute bottom-full right-0 z-20 mb-1.5 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                          >
                            <button
                              onClick={() => {
                                setPreviewOrder(order);
                                setMoreMenuOrderId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              View PDF Bill
                            </button>
                            <button
                              onClick={() => {
                                handleDirectPdfDownload(order);
                                setMoreMenuOrderId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <FileText className="w-3.5 h-3.5 text-gray-500" />
                              Download PDF
                            </button>
                            <button
                              onClick={() => {
                                handleSendWhatsAppUpdate(order._id);
                                setMoreMenuOrderId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              Send WhatsApp Update
                            </button>
                            {['READY', 'COMPLETED'].includes(order.orderStatus) && (
                              <button
                                onClick={() => {
                                  handleGenerateBill(order._id);
                                  setMoreMenuOrderId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                                Print Bill
                              </button>
                            )}
                            {['PENDING', 'ACCEPTED', 'PACKING'].includes(order.orderStatus) && (
                              <>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  onClick={() => {
                                    const reason = prompt('Cancellation reason:');
                                    setMoreMenuOrderId(null);
                                    if (reason !== null) handleStatusUpdate(order._id, 'CANCELLED');
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Cancel Order
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <button
            type="button"
            disabled={!pagination.hasPrevPage}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <span className="text-[11px] font-bold text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setCurrentPage((page) => page + 1)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      <InvoiceReceiptModal invoiceData={invoiceData} onClose={() => setInvoiceData(null)} />

      {/* View-only PDF preview; closing it does not download or save a file. */}
      <OrderPdfModal
        order={previewOrder}
        store={store}
        isOpen={!!previewOrder}
        onClose={() => setPreviewOrder(null)}
      />

      {/* Collect Payment / Dynamic UPI QR Modal */}
      {paymentOrder && (
        <PaymentModal
          storeId={storeId}
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSuccess={() => fetchQueue(false)}
        />
      )}
    </div>
  );
};