import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { QrCode, CheckCircle2, DollarSign, CreditCard, BookOpen, X, Check } from 'lucide-react';

export const PaymentModal = ({ storeId, order, onClose, onSuccess }) => {
  const [method, setMethod] = useState('UPI'); // 'UPI' | 'CASH' | 'UDHAR'
  const [upiData, setUpiData] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpiDetails = async () => {
      try {
        setLoading(true);
        const res = await paymentService.getUpiQrPayload(storeId, order._id);
        setUpiData(res.data);
      } catch (err) {
        console.error('Failed to load UPI details', err);
      } finally {
        setLoading(false);
      }
    };

    if (storeId && order) {
      fetchUpiDetails();
    }
  }, [storeId, order]);

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await paymentService.recordPayment(storeId, {
        orderId: order._id,
        amount: order.grandTotal,
        method,
        transactionId: method === 'UPI' ? transactionId : null
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Google QR Code Image API URL for NPCI UPI String
  const qrCodeImageUrl = upiData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiData.upiUri)}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 mb-4">
          <div>
            <h4 className="font-bold text-gray-900 text-base">Collect Payment</h4>
            <p className="text-xs text-gray-500">Order #{order?.orderNumber} • Amount: ₹{order?.grandTotal}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

        {/* Method Toggle Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMethod('UPI')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              method === 'UPI'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            UPI QR
          </button>
          <button
            type="button"
            onClick={() => setMethod('CASH')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              method === 'CASH'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Cash
          </button>
          <button
            type="button"
            onClick={() => setMethod('UDHAR')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              method === 'UDHAR'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Udhar
          </button>
        </div>

        {/* UPI QR Code View */}
        {method === 'UPI' && (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center space-y-3 mb-4">
            <p className="text-xs text-gray-600 font-medium">Scan QR with Paytm / PhonePe / Google Pay / BHIM</p>

            {loading ? (
              <div className="py-8 text-xs text-gray-400">Generating Store UPI QR Code...</div>
            ) : (
              <div className="bg-white p-3 rounded-xl inline-block shadow-xs border border-gray-200">
                <img src={qrCodeImageUrl} alt="Store UPI QR Code" className="w-44 h-44 mx-auto" />
                <span className="text-[11px] font-mono text-gray-600 block mt-1 font-bold">
                  {upiData?.upiId}
                </span>
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="UPI Reference No / UTR (Optional)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none bg-white font-mono"
              />
            </div>
          </div>
        )}

        {method === 'CASH' && (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center space-y-2 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
            <p className="text-sm font-bold text-gray-800">Cash Payment Collection</p>
            <p className="text-xs text-gray-500">Collect ₹{order?.grandTotal} in cash from customer.</p>
          </div>
        )}

        {method === 'UDHAR' && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center space-y-2 mb-4">
            <BookOpen className="w-8 h-8 text-amber-700 mx-auto" />
            <p className="text-sm font-bold text-amber-900">Add to Customer Udhar Ledger</p>
            <p className="text-xs text-amber-800">
              ₹{order?.grandTotal} will be added to {order?.customerDetails?.name}'s store credit balance.
            </p>
          </div>
        )}

        <button
          onClick={handleCollectPayment}
          disabled={submitting}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {submitting ? 'Recording Payment...' : `Confirm Payment Received (₹${order?.grandTotal})`}
        </button>
      </div>
    </div>
  );
};