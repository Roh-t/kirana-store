import React, { useState } from 'react';
import { publicService } from '../../services/publicService';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Clock, RotateCcw, Phone, X, Check } from 'lucide-react';

export const CustomerOrderHistoryModal = ({ slug, isOpen, onClose }) => {
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { updateQuantity } = useCart();

  if (!isOpen) return null;

  const handleFetchHistory = async (e) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const res = await publicService.getCustomerOrders(slug, phone);
      setHistory(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load past orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (order) => {
    let readdedCount = 0;
    order.items.forEach((item) => {
      if (item.productId && !item.productId.isDeleted && item.productId.isAvailable) {
        updateQuantity(item.productId, item.quantity);
        readdedCount++;
      }
    });

    alert(`Reloaded ${readdedCount} item(s) from Order #${order.orderNumber} into your active cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-700" />
            <h3 className="font-bold text-gray-900 text-base">My Past Orders</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lookup Phone Input */}
        {!history && (
          <form onSubmit={handleFetchHistory} className="space-y-3">
            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Enter Your Registered Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              {loading ? 'Finding Orders...' : 'View Order History'}
            </button>
          </form>
        )}

        {/* History Results List */}
        {history && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-800">
                Found {history.orders.length} Past Order(s) for {history.customer?.name}
              </span>
              <button onClick={() => setHistory(null)} className="text-xs text-green-700 font-bold hover:underline">
                Search Different Phone
              </button>
            </div>

            {history.orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No past orders found for this mobile number.</p>
            ) : (
              history.orders.map((order) => (
                <div key={order._id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs border-b pb-2 border-gray-200">
                    <span className="font-mono font-extrabold text-gray-900">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-green-100 text-green-800">
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.quantity}x {item.nameSnapshot}</span>
                        <span className="font-bold">₹{item.lineGrandTotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-green-700">Total: ₹{order.grandTotal}</span>
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      One-Click Reorder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};