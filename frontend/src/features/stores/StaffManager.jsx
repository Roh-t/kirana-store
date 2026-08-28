import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import { UserCheck, UserPlus, Trash2, Phone, ShieldCheck, Check, X } from 'lucide-react';

export const StaffManager = ({ storeId }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', roleName: 'CASHIER' });
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await staffService.getStaff(storeId);
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStaff();
    }
  }, [storeId]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await staffService.addStaff(storeId, formData);
      setShowModal(false);
      setFormData({ name: '', phone: '', roleName: 'CASHIER' });
      fetchStaff();
    } catch (err) {
      const detailMsg = err.details && err.details.length > 0 ? err.details[0].message : null;
      setError(detailMsg || err.message || 'Failed to add staff member');
    }
  };

  const handleRemoveStaff = async (staffUserId) => {
    if (window.confirm('Are you sure you want to revoke store access for this staff member?')) {
      try {
        await staffService.removeStaff(storeId, staffUserId);
        fetchStaff();
      } catch (err) {
        alert(err.message || 'Failed to remove staff member');
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Store Staff & Multi-User Access</h3>
            <p className="text-xs text-gray-500">Manage counter cashiers and billing staff</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite Staff
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading staff directory...</div>
      ) : staffList.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-xs text-gray-500 font-medium">No staff members assigned yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {staffList.map((member) => (
            <div key={member.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{member.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {member.phone}
                </p>
              </div>

              {member.roleCode !== 'STORE_OWNER' && (
                <button
                  onClick={() => handleRemoveStaff(member.id)}
                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                  title="Revoke Store Access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 mb-4">
              <h4 className="font-bold text-gray-900">Invite Staff Member</h4>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number (10-digit, starts with 6-9)
                </label>
                <input
                  type="text"
                  required
                  placeholder="9876543212"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Role</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none bg-white font-bold"
                >
                  <option value="CASHIER">CASHIER (Process Queue & Accept Payments)</option>
                  <option value="BILLING_STAFF">BILLING STAFF (POS & Thermal Printing)</option>
                  <option value="STORE_MANAGER">STORE MANAGER (Catalog & Inventory Edit)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Grant Store Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};