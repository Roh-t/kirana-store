import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Lock, Mail, ArrowRight } from 'lucide-react';

export const RegisterPage = ({ onSwitchToLogin }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await authService.register(formData);
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-amber-200">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-900">Create Account</h2>
        <p className="text-xs text-stone-500 mt-1">Register as Kirana Store Owner</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              required
              placeholder="Ramesh Gupta"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              required
              placeholder="9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Optional)</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="email"
              placeholder="ramesh@guptastores.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Set Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {submitting ? 'Registering...' : 'Register Store Account'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-xs text-emerald-700 font-semibold hover:underline"
        >
          Already registered? Login Here
        </button>
      </div>
    </div>
  );
};