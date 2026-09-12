import React, { useEffect, useState } from 'react';
import { razorpayService } from '../../services/razorpayService';
import { Landmark, ShieldCheck, Clock3, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_META = {
  NOT_ONBOARDED: { label: 'Not Set Up', color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Landmark },
  PENDING: { label: 'Verification Pending', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock3 },
  ACTIVE: { label: 'Active — Accepting Online Payments', color: 'text-green-700 bg-green-50 border-green-200', icon: ShieldCheck },
  REJECTED: { label: 'Rejected — Please Re-submit', color: 'text-red-700 bg-red-50 border-red-200', icon: XCircle }
};

export const PayoutSettings = ({ storeId }) => {
  const [status, setStatus] = useState('NOT_ONBOARDED');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    legalBusinessName: '',
    beneficiaryName: '',
    email: '',
    phone: '',
    accountNumber: '',
    ifsc: '',
    pan: ''
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await razorpayService.getPayoutAccountStatus(storeId);
      setStatus(res.data?.status || 'NOT_ONBOARDED');
    } catch (err) {
      console.error('Failed to load payout account status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchStatus();
  }, [storeId]);

  const handleChange = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await razorpayService.onboardPayoutAccount(storeId, formData);
      setSuccess('Submitted! Razorpay will verify your details before enabling online payments.');
      fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to submit payout details');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = STATUS_META[status] || STATUS_META.NOT_ONBOARDED;
  const StatusIcon = meta.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-gray-500" />
          <span className="font-bold text-sm text-gray-900">Online Payments Payout Account</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${meta.color}`}>
            <StatusIcon className="w-3 h-3" />
            {loading ? 'Loading...' : meta.label}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Link your bank account once. Customers can then pay online (UPI/Card/Netbanking) directly at checkout —
            Razorpay auto-transfers the money into this account and your app is notified the moment it's verified,
            with no manual "trust me I paid" step.
          </p>

          {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}
          {success && <div className="p-2.5 bg-green-50 text-green-700 text-xs rounded-lg font-medium">{success}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Legal / Registered Business Name"
              value={formData.legalBusinessName}
              onChange={handleChange('legalBusinessName')}
              className="col-span-2 px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
            />
            <input
              required
              placeholder="Bank Account Holder Name"
              value={formData.beneficiaryName}
              onChange={handleChange('beneficiaryName')}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
            />
            <input
              required
              type="email"
              placeholder="Email for KYC updates"
              value={formData.email}
              onChange={handleChange('email')}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
            />
            <input
              required
              placeholder="Contact Phone (10-digit)"
              value={formData.phone}
              onChange={handleChange('phone')}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
            />
            <input
              required
              placeholder="Bank Account Number"
              value={formData.accountNumber}
              onChange={handleChange('accountNumber')}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none font-mono"
            />
            <input
              required
              placeholder="IFSC Code"
              value={formData.ifsc}
              onChange={handleChange('ifsc')}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none font-mono uppercase"
            />
            <input
              placeholder="PAN (optional, speeds up verification)"
              value={formData.pan}
              onChange={handleChange('pan')}
              className="col-span-2 px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none font-mono uppercase"
            />

            <button
              type="submit"
              disabled={submitting}
              className="col-span-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : status === 'ACTIVE' ? 'Update Payout Details' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
