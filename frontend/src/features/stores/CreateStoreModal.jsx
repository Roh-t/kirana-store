import React, { useState } from 'react';
import { storeService } from '../../services/storeService';
import { Store, MapPin, QrCode, Phone, CheckCircle } from 'lucide-react';

export const CreateStoreModal = ({ onStoreCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    qrConfig: {
      upiId: ''
    },
    businessConfig: {
      minOrderValue: 0
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await storeService.createStore(formData);
      onStoreCreated(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create store. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6 border-b pb-4 border-gray-100">
        <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Setup Your Kirana Store</h2>
          <p className="text-xs text-gray-500">Create your digital storefront workspace</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Gupta Super Store"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Official Store Contact Phone</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              required
              placeholder="9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-green-600" />
            Store Address Details
          </div>

          <div>
            <input
              type="text"
              required
              placeholder="Shop No., Street / Area"
              value={formData.address.street}
              onChange={(e) =>
                setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })
              }
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="City"
              value={formData.address.city}
              onChange={(e) =>
                setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })
              }
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
            />
            <input
              type="text"
              required
              placeholder="State"
              value={formData.address.state}
              onChange={(e) =>
                setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })
              }
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
            />
            <input
              type="text"
              required
              placeholder="PIN Code"
              value={formData.address.pincode}
              onChange={(e) =>
                setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })
              }
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Store UPI ID for Direct QR Payments (Optional)
          </label>
          <div className="relative">
            <QrCode className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="guptastore@paytm"
              value={formData.qrConfig.upiId}
              onChange={(e) =>
                setFormData({ ...formData, qrConfig: { ...formData.qrConfig, upiId: e.target.value } })
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          {submitting ? 'Creating Store Workspace...' : 'Launch Digital Store Workspace'}
        </button>
      </form>
    </div>
  );
};