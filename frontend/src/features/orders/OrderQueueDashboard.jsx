import React, { useState, useEffect, useRef } from 'react';
import { orderService } from '../../services/orderService';
import { billingService } from '../../services/billingService';
import { whatsappService } from '../../services/whatsappService';
import { downloadOrderPdf } from '../../utils/pdfDownloader';
import { InvoiceReceiptModal } from '../billing/InvoiceReceiptModal';
import { PaymentModal } from '../payments/PaymentModal';
import {
  ShoppingBag,
  BellRing,
  Clock,
  CheckCircle,
  PackageCheck,
  CheckCheck,
  XCircle,
  RefreshCw,
  Phone,
  User,
  MapPin,
  Receipt,
  QrCode,
  MessageSquare,
  Trash2,
  FileText
} from 'lucide-react';

export const OrderQueueDashboard = ({ storeId }) => {
  const [orders, setOrders] = useState([]);
  const [statusSummary, setStatusSummary] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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
      const res = await orderService.getOrderQueue(storeId, { status: selectedStatus });
      setOrders(res.data);
      if (res.meta?.statusSummary) {
        const summary = res.meta.statusSummary;
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
  }, [storeId, selectedStatus]);

  useEffect(() => {
    if (!autoRefresh || !storeId) return;
    const interval = setInterval(() => {
      fetchQueue(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, storeId, selectedStatus]);

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
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
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
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 active:scale-95 ${
              selectedStatus === tab.key
                ? 'bg-green-700 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                  tab.badgeBg || (selectedStatus === tab.key ? 'bg-white text-green-800' : 'bg-gray-200 text-gray-800')
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 font-bold">Syncing live queue...</div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <Clock className="w-7 h-7 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-bold">No orders in this state</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((order) => {
            const isPending = order.orderStatus === 'PENDING';
            const isModifiable = ['PENDING', 'ACCEPTED', 'PACKING'].includes(order.orderStatus);
            const isExpanded = expandedOrderId === order._id;

            return (
              <div
                key={order._id}
                className={`overflow-hidden rounded-2xl border transition ${
                  isPending ? 'bg-amber-50/70 border-amber-300 shadow-2xs' : 'bg-white border-gray-200/90'
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
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-800 whitespace-nowrap">
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
                            ? 'bg-purple-100 text-purple-800'
                            : order.orderStatus === 'READY'
                            ? 'bg-amber-100 text-amber-800'
                            : order.orderStatus === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">{isExpanded ? 'Hide' : 'View'}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-700">
                    <div className="flex min-w-0 items-center gap-1.5 text-gray-900">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-semibold">{order.customerDetails.name}</span>
                    </div>
                    <div className="text-sm font-black text-green-700 whitespace-nowrap">₹{order.grandTotal}</div>
                  </div>

                  {!isExpanded && (
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="truncate">
                        {order.items.slice(0, 2).map((item) => `${item.quantity}x ${item.nameSnapshot}`).join(' • ')}
                        {order.items.length > 2 ? ' • +' + (order.items.length - 2) + ' more' : ''}
                      </span>
                      <span>{order.items.length} items</span>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-3">
                    <div className="text-xs text-gray-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold flex items-center gap-1 text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {order.customerDetails.name}
                      </span>
                      <span className="font-mono text-gray-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {order.customerDetails.phone}
                      </span>
                      {order.customerDetails.deliveryAddress && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {order.customerDetails.deliveryAddress}
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 my-2 text-xs space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-gray-700">
                          <span>
                            {item.quantity}x {item.nameSnapshot} ({item.unitSnapshot})
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">₹{item.lineGrandTotal}</span>
                            {isModifiable && (
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

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Payable Total</span>
                        <span className="text-sm font-black text-green-700">₹{order.grandTotal}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {order.orderStatus === 'PENDING' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStatusUpdate(order._id, 'ACCEPTED');
                            }}
                            className="px-3 py-1.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Accept
                          </button>
                        )}

                        {order.orderStatus === 'ACCEPTED' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStatusUpdate(order._id, 'PACKING');
                            }}
                            className="px-3 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition active:scale-95"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Pack
                          </button>
                        )}

                        {order.orderStatus === 'PACKING' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStatusUpdate(order._id, 'READY');
                            }}
                            className="px-3 py-1.5 bg-purple-600 active:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Ready
                          </button>
                        )}

                        {order.orderStatus === 'READY' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStatusUpdate(order._id, 'COMPLETED');
                            }}
                            className="px-3 py-1.5 bg-green-700 active:bg-green-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Complete
                          </button>
                        )}

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDirectPdfDownload(order);
                          }}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition border border-gray-200"
                          title="Direct PDF Download"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-700" />
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSendWhatsAppUpdate(order._id);
                          }}
                          className="p-1.5 bg-emerald-50 text-emerald-700 active:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition"
                          title="Send WhatsApp Update"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        </button>

                        {order.paymentStatus !== 'PAID' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setPaymentOrder(order);
                            }}
                            className="px-2.5 py-1.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            UPI
                          </button>
                        )}

                        {['READY', 'COMPLETED'].includes(order.orderStatus) && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleGenerateBill(order._id);
                            }}
                            className="p-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold transition"
                            title="Print Bill"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {['PENDING', 'ACCEPTED', 'PACKING'].includes(order.orderStatus) && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              const reason = prompt('Cancellation reason:');
                              if (reason !== null) handleStatusUpdate(order._id, 'CANCELLED');
                            }}
                            className="p-1.5 text-red-500 active:bg-red-50 rounded-lg border border-red-200 transition"
                            title="Cancel Order"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

      {/* Thermal Receipt Modal */}
      <InvoiceReceiptModal invoiceData={invoiceData} onClose={() => setInvoiceData(null)} />

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