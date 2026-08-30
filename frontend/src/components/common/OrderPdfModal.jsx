import React from 'react';
import { X, Printer, Download, CheckCircle, MapPin, Phone, User, Store } from 'lucide-react';

export const OrderPdfModal = ({ order, store, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[92vh]">
        {/* Modal Controls (Hidden during PDF print) */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-700" />
            <h3 className="font-extrabold text-gray-900 text-sm">PDF Order Slip</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Download / Print PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PDF Document Wrapper */}
        <div id="pdf-document" className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 overflow-y-auto pr-1 text-gray-900 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-700" />
                <h2 className="text-lg font-black tracking-tight uppercase text-green-800">{store?.name || 'Kirana Store'}</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">{store?.address?.street}, {store?.address?.city}</p>
              <p className="text-xs text-gray-500">Ph: {store?.phone}</p>
              {store?.taxConfig?.gstin && <p className="text-[11px] font-bold text-gray-700 mt-0.5">GSTIN: {store.taxConfig.gstin}</p>}
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-extrabold text-gray-900 block">{order.orderNumber}</span>
              <span className="text-[11px] text-gray-400 block mt-0.5">
                {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800">
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Customer & Fulfillment Info */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1">
            <div className="flex justify-between font-bold text-gray-800">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {order.customerDetails?.name}
              </span>
              <span className="font-mono text-gray-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {order.customerDetails?.phone}
              </span>
            </div>
            <p className="text-gray-500 flex items-center gap-1 pt-1 border-t border-gray-200/60 mt-1">
              <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
              Fulfillment: <strong className="text-gray-800">{order.orderType}</strong> {order.customerDetails?.deliveryAddress ? `• ${order.customerDetails.deliveryAddress}` : ''}
            </p>
          </div>

          {/* Order Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase border-b border-gray-200">
                <tr>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5">
                      <span className="font-bold block">{item.nameSnapshot}</span>
                      <span className="text-[10px] text-gray-400">{item.unitSnapshot}</span>
                    </td>
                    <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-right text-gray-500">₹{item.sellingPriceSnapshot}</td>
                    <td className="p-2.5 text-right font-extrabold text-gray-900">₹{item.lineGrandTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="bg-green-50/60 p-3.5 rounded-2xl border border-green-200/60 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{order.subTotal}</span>
            </div>
            {order.taxTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>GST Tax</span>
                <span>₹{order.taxTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-green-900 pt-1 border-t border-green-200">
              <span>Grand Total Payable</span>
              <span>₹{order.grandTotal}</span>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-dashed border-gray-200">
            <p className="font-bold text-gray-600">Thank you for ordering with {store?.name || 'us'}!</p>
            <p>Digital Order Slip powered by KiranaFlow SaaS</p>
          </div>
        </div>
      </div>
    </div>
  );
};