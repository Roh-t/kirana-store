import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { Package, Users, Zap } from 'lucide-react';

export const SubscriptionBanner = ({ storeId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getSubscription(storeId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load subscription details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchSubscription();
    }
  }, [storeId]);

  const handleUpgrade = async (plan) => {
    try {
      setUpgrading(true);
      await subscriptionService.upgradePlan(storeId, plan);
      alert(`Successfully upgraded store plan to ${plan}!`);
      fetchSubscription();
    } catch (err) {
      alert(err.message || 'Failed to upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading || !data) return null;

  const sub = data.subscription;
  const usage = data.usage;

  return (
    <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-black rounded-xl uppercase tracking-wide">
          {sub.status === 'TRIAL' ? '14-Day Free Trial' : `${sub.plan} PLAN`}
        </span>

        <div className="flex items-center gap-3 text-xs text-gray-600 font-bold">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-green-600" />
            Products: {usage.products.current}/{usage.products.max === -1 ? '∞' : usage.products.max}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-green-600" />
            Staff: {usage.staff.current}/{usage.staff.max === -1 ? '∞' : usage.staff.max}
          </span>
        </div>
      </div>

      {sub.plan === 'FREE' && (
        <button
          onClick={() => handleUpgrade('PRO')}
          disabled={upgrading}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition shadow-2xs active:scale-95 shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          {upgrading ? 'Upgrading...' : 'Upgrade to PRO'}
        </button>
      )}
    </div>
  );
};