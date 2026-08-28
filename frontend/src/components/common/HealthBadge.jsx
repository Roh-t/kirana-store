import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { LoadingSpinner } from './LoadingSpinner';

export const HealthBadge = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (loading) return <LoadingSpinner size="sm" label="Connecting to KiranaFlow Engine..." />;

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-md w-full shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Engine Disconnected</span>
          <button
            onClick={checkHealth}
            className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Retry Connection
          </button>
        </div>
        <p className="text-xs mt-1 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white border border-amber-200 shadow-sm rounded-2xl max-w-md w-full">
      <div className="flex items-center justify-between border-b pb-3 border-amber-100">
        <span className="text-sm font-bold text-stone-800">{health?.service}</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          {health?.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-stone-600">
        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
          <span className="text-stone-400 block mb-0.5">Database State</span>
          <span className="font-semibold text-stone-700">{health?.database?.state}</span>
        </div>
        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
          <span className="text-stone-400 block mb-0.5">Uptime</span>
          <span className="font-semibold text-stone-700">{health?.uptimeSeconds} seconds</span>
        </div>
      </div>
    </div>
  );
};