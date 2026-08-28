import React from 'react';
import { CheckCircle2, Clock, ShoppingBag, MapPin, ArrowLeft } from 'lucide-react';

export const OrderSuccessView = ({ order, onBackToStore }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Order Submitted
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2">{order.orderNumber}</h2>
          <p className="text-xs text-gray-500 mt-1">Your order has been sent to the Kirana shopkeeper</p>
        </div>

        {/* Live Status Indicator */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            Queue Status:
          </span>
          <span className="font-extrabold text-amber-700 uppercase bg-amber-100 px-2.5 py-0.5 rounded-md">
            {order.orderStatus}
          </span>
        </div>

        {/* Item Summary */}
        <div className="text-left border-t border-b border-gray-100 py-3 space-y-2 text-xs">
          <span className="font-bold text-gray-800 block">Ordered Items ({order.items.length})</span>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-600">
              <span>
                {item.quantity}x {item.nameSnapshot} ({item.unitSnapshot})
              </span>
              <span className="font-bold text-gray-900">₹{item.lineGrandTotal}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t">
            <span>Payable Amount</span>
            <span className="text-green-700">₹{order.grandTotal}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="text-left bg-gray-50 p-3 rounded-xl text-xs space-y-1 text-gray-600">
          <p className="font-bold text-gray-800">{order.customerDetails.name} ({order.customerDetails.phone})</p>
          <p className="flex items-center gap-1 text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            Type: {order.orderType} {order.customerDetails.deliveryAddress ? `• ${order.customerDetails.deliveryAddress}` : ''}
          </p>
        </div>

        <button
          onClick={onBackToStore}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Store Catalog
        </button>
      </div>
    </div>
  );
};