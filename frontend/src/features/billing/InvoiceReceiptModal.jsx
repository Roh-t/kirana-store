import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

export const InvoiceReceiptModal = ({ invoiceData, onClose }) => {
  if (!invoiceData) return null;

  const { invoice, store, order } = invoiceData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-amber-200 flex flex-col max-h-[90vh]">
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b pb-3 border-amber-100 mb-4 print:hidden">
          <h4 className="font-bold text-stone-900 text-sm">Print Thermal Receipt</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal Printable Receipt View */}
        <div id="thermal-receipt" className="text-stone-900 font-mono text-xs space-y-3 overflow-y-auto pr-1">
          {/* Header */}
          <div className="text-center border-b pb-2 border-dashed border-amber-300">
            <h2 className="text-base font-extrabold tracking-tight uppercase">{store?.name}</h2>
            <p className="text-[11px] text-stone-600">{store?.address?.street}, {store?.address?.city}</p>
            <p className="text-[11px] text-stone-600">Ph: {store?.phone}</p>
            {store?.taxConfig?.gstin && <p className="text-[10px] font-bold">GSTIN: {store.taxConfig.gstin}</p>}
          </div>

          {/* Invoice Info */}
          <div className="text-[11px] border-b pb-2 border-dashed border-amber-300 space-y-0.5">
            <div className="flex justify-between">
              <span>Invoice #:</span>
              <span className="font-bold">{invoice?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Order #:</span>
              <span>{order?.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(invoice?.generatedAt).toLocaleDateString()} {new Date(invoice?.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order?.customerDetails?.name} ({order?.customerDetails?.phone})</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-b pb-2 border-dashed border-amber-300 space-y-1.5">
            <div className="flex justify-between text-[11px] font-extrabold border-b pb-1">
              <span>Item</span>
              <span>Qty x Rate</span>
              <span>Amount</span>
            </div>

            {order?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <div className="truncate max-w-[140px]">
                  <span>{item.nameSnapshot}</span>
                </div>
                <span>{item.quantity} x ₹{item.sellingPriceSnapshot}</span>
                <span className="font-bold">₹{item.lineGrandTotal}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs border-b pb-2 border-dashed border-amber-300">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>₹{invoice?.subTotal}</span>
            </div>
            {invoice?.taxTotal > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>GST Tax</span>
                <span>₹{invoice?.taxTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1">
              <span>Grand Total</span>
              <span>₹{invoice?.grandTotal}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-stone-500 pt-1">
            <p className="font-bold">Thank you for shopping with us!</p>
            <p>Powered by KiranaFlow Digital POS</p>
          </div>
        </div>
      </div>
    </div>
  );
};