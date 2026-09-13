import React, { useState } from 'react';
import { downloadOrderPdf } from '../../utils/pdfDownloader';
import { paymentService } from '../../services/paymentService';
import { CheckCircle2, Clock, ArrowLeft, Download, QrCode, Upload, ShieldCheck } from 'lucide-react';

export const OrderSuccessView = ({ order: initialOrder, store, onBackToStore }) => {
  const [downloading, setDownloading] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [upiData, setUpiData] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleDirectDownload = async () => {
    try {
      setDownloading(true);
      await downloadOrderPdf(order, order.storeId);
    } catch (err) {
      alert('Failed to download PDF bill');
    } finally {
      setDownloading(false);
    }
  };

  React.useEffect(() => {
    if (!store?.slug || !order?._id || !store.qrConfig?.upiId) return;
    paymentService.getPublicUpiQr(store.slug, order._id)
      .then((response) => setUpiData(response.data))
      .catch((error) => setPayError(error.message || 'Unable to load the store QR code'));
  }, [store?.slug, store?.qrConfig?.upiId, order?._id]);

  const handleProofFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPayError('Please select a payment screenshot image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setPayError('Payment screenshot must be smaller than 4 MB.');
      return;
    }
    setPayError(null);
    setProofFile(file);
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !upiData) {
      setPayError('Upload the payment screenshot after completing the UPI payment.');
      return;
    }
    setPayError(null);
    setSubmittingProof(true);
    try {
      const reader = new FileReader();
      const imageData = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read the screenshot.'));
        reader.readAsDataURL(proofFile);
      });
      await paymentService.submitPublicPaymentProof(store.slug, order._id, { imageData, transactionId });
      setProofSubmitted(true);
      setProofFile(null);
    } catch (err) {
      setPayError(err.message || 'Failed to submit payment screenshot');
    } finally {
      setSubmittingProof(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl border border-gray-200 shadow-sm p-6 space-y-5 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[10px] font-black text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider border border-green-200/60">
            Order Submitted
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2">{order.orderNumber}</h2>
          <p className="text-xs text-gray-500 mt-1">Your order has been sent to the Kirana shopkeeper</p>
        </div>

        {/* Live Status Indicator */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            Queue Status:
          </span>
          <span className="font-black text-amber-700 uppercase bg-amber-100 px-2.5 py-0.5 rounded-md">
            {order.orderStatus}
          </span>
        </div>

        {/* Item Summary */}
        <div className="text-left border-t border-b border-gray-100 py-3 space-y-2 text-xs">
          <span className="font-extrabold text-gray-800 block">Ordered Items ({order.items.length})</span>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-600">
              <span>
                {item.quantity}x {item.nameSnapshot} ({item.unitSnapshot})
              </span>
              <span className="font-bold text-gray-900">₹{item.lineGrandTotal}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
            <span>Payable Amount</span>
            <span className="text-green-700">₹{order.grandTotal}</span>
          </div>
        </div>

        {/* Optional manual UPI payment */}
        {order.paymentStatus === 'PAID' ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center justify-center gap-2 text-green-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            Payment Verified & Received
          </div>
        ) : proofSubmitted ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-800 text-xs font-bold">
            Screenshot submitted. The store owner will verify your payment.
          </div>
        ) : upiData ? (
          <div className="space-y-2">
            {payError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium text-left">{payError}</div>
            )}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center space-y-2">
              <p className="text-xs font-bold text-gray-800">Pay ₹{upiData.amount} using any UPI app</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiData.upiUri)}`}
                alt="Store UPI QR Code"
                className="w-44 h-44 mx-auto rounded-xl bg-white p-2"
              />
              <p className="text-[11px] font-mono text-gray-600">{upiData.upiId}</p>
              <input
                type="text"
                placeholder="UPI reference / UTR (optional)"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none bg-white"
              />
              <label className="w-full py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {proofFile ? proofFile.name : 'Upload payment screenshot'}
                <input type="file" accept="image/*" onChange={handleProofFile} className="hidden" />
              </label>
              <button
                onClick={handleSubmitProof}
                disabled={submittingProof || !proofFile}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                {submittingProof ? 'Submitting screenshot...' : 'Submit Payment Screenshot'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400">Payment is marked received only after the store owner verifies your screenshot.</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Pay in cash or via UPI QR at pickup/delivery, or to the delivery staff.</p>
        )}

        {/* Direct PDF Download Button */}
        <button
          onClick={handleDirectDownload}
          disabled={downloading}
          className="w-full py-2.5 bg-green-50 text-green-700 active:bg-green-100 border border-green-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download PDF Bill Directly'}
        </button>

        <button
          onClick={onBackToStore}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Store Catalog
        </button>
      </div>
    </div>
  );
};