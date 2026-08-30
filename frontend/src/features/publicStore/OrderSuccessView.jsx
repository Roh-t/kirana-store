import React, { useState } from 'react';
import { downloadOrderPdf } from '../../utils/pdfDownloader';
import { CheckCircle2, Clock, MapPin, ArrowLeft, Download } from 'lucide-react';

export const OrderSuccessView = ({ order, onBackToStore }) => {
  const [downloading, setDownloading] = useState(false);

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