import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerService';
import { whatsappService } from '../../services/whatsappService';
import { Users, Plus, Search, BookOpen, Check, X, Phone, MessageSquare } from 'lucide-react';

export const CustomerManager = ({ storeId }) => {
  const [customers, setCustomers] = useState([]);
  const [totalUdhar, setTotalUdhar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasUdharOnly, setHasUdharOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [udharModalCustomer, setUdharModalCustomer] = useState(null);

  const [formData, setFormData] = useState({ name: '', phone: '', udharBalance: 0 });
  const [udharShift, setUdharShift] = useState('');
  const [isRepayment, setIsRepayment] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers(storeId, {
        search,
        hasUdhar: hasUdharOnly ? 'true' : 'false'
      });
      setCustomers(res.data);
      setTotalUdhar(res.meta?.totalUdharBalance || 0);
    } catch (err) {
      console.error('Failed to load customer database', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchCustomers();
    }
  }, [storeId, search, hasUdharOnly]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await customerService.createCustomer(storeId, {
        ...formData,
        udharBalance: Number(formData.udharBalance)
      });
      setShowAddModal(false);
      setFormData({ name: '', phone: '', udharBalance: 0 });
      fetchCustomers();
    } catch (err) {
      const detailMsg = err.details && err.details.length > 0 ? err.details[0].message : null;
      setError(detailMsg || err.message || 'Failed to add customer profile');
    }
  };

  const handleUdharSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const shift = Number(udharShift);
    const delta = isRepayment ? -Math.abs(shift) : Math.abs(shift);

    try {
      await customerService.updateUdhar(storeId, udharModalCustomer._id, delta);
      setUdharModalCustomer(null);
      setUdharShift('');
      fetchCustomers();
    } catch (err) {
      const detailMsg = err.details && err.details.length > 0 ? err.details[0].message : null;
      setError(detailMsg || err.message || 'Failed to update Udhar balance');
    }
  };

  const handleSendUdharReminder = async (customerId) => {
    try {
      const res = await whatsappService.getUdharWhatsAppLink(storeId, customerId);
      window.open(res.data.whatsappUrl, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to generate WhatsApp reminder link');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Customers & Udhar</h3>
            <p className="text-[11px] text-gray-500">Store Credit Ledger</p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          className="px-3 py-1.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Customer
        </button>
      </div>

      {/* Udhar Ledger Summary Card */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-amber-800 block leading-tight">Pending Udhar</span>
            <span className="text-base font-black text-amber-900">₹{totalUdhar}</span>
          </div>
        </div>
        <button
          onClick={() => setHasUdharOnly(!hasUdharOnly)}
          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition ${
            hasUdharOnly ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-800 border-amber-300'
          }`}
        >
          {hasUdharOnly ? 'Show All' : 'Filter Udhar'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customer by name or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
        />
      </div>

      {/* Mobile Customer List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400 font-bold">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-bold">No customers found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {customers.map((c) => (
            <div key={c._id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{c.name}</span>
                  <span className="text-[10px] font-mono text-gray-500 flex items-center gap-0.5 shrink-0">
                    <Phone className="w-2.5 h-2.5 text-gray-400" />
                    {c.phone}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  Orders: {c.totalOrders} • Total Spent: ₹{c.totalSpent}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-medium">Udhar</span>
                  <span className={`text-xs sm:text-sm font-black ${c.udharBalance > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                    ₹{c.udharBalance}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {c.udharBalance > 0 && (
                    <button
                      onClick={() => handleSendUdharReminder(c._id)}
                      className="p-1.5 bg-emerald-50 text-emerald-700 active:bg-emerald-100 border border-emerald-300 rounded-xl transition"
                      title="Send WhatsApp Udhar Reminder"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setError(null);
                      setUdharModalCustomer(c);
                      setIsRepayment(false);
                      setUdharShift('');
                    }}
                    className="px-2 py-1 bg-amber-50 text-amber-800 active:bg-amber-100 border border-amber-200 rounded-lg text-xs font-extrabold transition active:scale-95"
                  >
                    + Udhar
                  </button>
                  {c.udharBalance > 0 && (
                    <button
                      onClick={() => {
                        setError(null);
                        setUdharModalCustomer(c);
                        setIsRepayment(true);
                        setUdharShift('');
                      }}
                      className="px-2 py-1 bg-green-50 text-green-700 active:bg-green-100 border border-green-200 rounded-lg text-xs font-extrabold transition active:scale-95"
                    >
                      Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm">Add Customer Profile</h4>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number (10-digit, starts with 6-9)
                </label>
                <input
                  type="text"
                  required
                  placeholder="9876543211"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Udhar Debt (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.udharBalance}
                  onChange={(e) => setFormData({ ...formData, udharBalance: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 active:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 active:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Udhar Modal */}
      {udharModalCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {isRepayment ? 'Record Repayment' : 'Add Udhar Debt'}
                </h4>
                <p className="text-xs text-gray-500">{udharModalCustomer.name} ({udharModalCustomer.phone})</p>
              </div>
              <button onClick={() => setUdharModalCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

            <form onSubmit={handleUdharSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isRepayment ? 'Repayment Received (₹)' : 'New Udhar Debt (₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 200"
                  value={udharShift}
                  onChange={(e) => setUdharShift(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUdharModalCustomer(null)}
                  className="px-4 py-2 bg-gray-100 active:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1 ${
                    isRepayment ? 'bg-green-600 active:bg-green-700' : 'bg-amber-600 active:bg-amber-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};