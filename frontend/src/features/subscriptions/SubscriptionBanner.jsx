import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { razorpayService, loadRazorpayScript } from '../../services/razorpayService';
import { useAuth } from '../../context/AuthContext';
import { Package, Users, Zap, Check, Crown, ArrowRight, ChevronRight } from 'lucide-react';

export const SubscriptionBanner = ({ storeId }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

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

  const handleRazorpayCheckout = async (targetPlan) => {
    try {
      setUpgrading(true);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setUpgrading(false);
        return;
      }

      const orderRes = await razorpayService.createSubscriptionOrder(storeId, targetPlan);
      const { orderId, amount, currency, keyId, storeName, plan } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'KiranaFlow SaaS',
        description: `Upgrade ${storeName} to ${plan} Plan`,
        image: '/favicon.ico',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          contact: user?.phone?.replace(/\D/g, '') || '',
          email: user?.email || ''
        },
        theme: {
          color: '#16a34a'
        },
        handler: async function (response) {
          try {
            await razorpayService.verifyPayment(storeId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan
            });
            alert(`🎉 Payment Successful! Your store is now active on ${plan} Plan!`);
            setShowPlanModal(false);
            fetchSubscription();
          } catch (verifyErr) {
            alert(verifyErr.message || 'Payment verification failed');
          } finally {
            setUpgrading(false);
          }
        },
        modal: {
          ondismiss: () => setUpgrading(false)
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.message || 'Failed to initiate payment checkout');
      setUpgrading(false);
    }
  };

  if (loading || !data) return null;

  const usage = data.usage || {
    products: { current: 7, max: -1 },
    staff: { current: 1, max: -1 }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-2.5 mb-2.5">
        {/* 1. Free Trial Banner */}
        <div className="w-full rounded-[20px] bg-white border border-gray-100 p-3 sm:p-4 shadow-xs relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <Crown className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-wider text-gray-400">14-DAY</div>
                <div className="text-sm sm:text-base font-black text-gray-900 leading-tight">Free Trial</div>
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Explore all premium features</div>
              </div>
            </div>

            <div className="relative shrink-0">
              <span className="absolute -top-1.5 left-0 text-[10px] select-none opacity-80 pointer-events-none">✨</span>
              <button
                onClick={() => setShowPlanModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black transition active:scale-95"
              >
                <span>Upgrade Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-900">7 days left</span>
              <span className="text-gray-400">Get Pro for more power</span>
            </div>
          </div>
        </div>

        {/* 2. Usage Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Products Card */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-3 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-gray-900">Products</span>
                </div>
                <button className="w-5 h-5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg font-black text-gray-900">{usage.products.current}</span>
                <span className="text-xs font-bold text-gray-400">/</span>
                <span className="text-xs font-bold text-gray-600">{usage.products.max === -1 ? '∞' : usage.products.max}</span>
              </div>

              <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: usage.products.max === -1 ? '100%' : `${Math.min(100, (usage.products.current / Math.max(usage.products.max, 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-2 text-[9px] font-medium text-gray-500 truncate">
              Add and manage products
            </div>
          </div>

          {/* Staff Card */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-3 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-gray-900">Staff</span>
                </div>
                <button className="w-5 h-5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg font-black text-gray-900">{usage.staff.current}</span>
                <span className="text-xs font-bold text-gray-400">/</span>
                <span className="text-xs font-bold text-gray-600">{usage.staff.max === -1 ? '∞' : usage.staff.max}</span>
              </div>

              <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: usage.staff.max === -1 ? '100%' : `${Math.min(100, (usage.staff.current / Math.max(usage.staff.max, 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-2 text-[9px] font-medium text-gray-500 truncate">
              Manage team and roles
            </div>
          </div>
        </div>

        {/* 3. Orange Upgrade Banner */}
        <div className="w-full rounded-[20px] bg-gradient-to-r from-amber-100/70 via-orange-100/80 to-amber-200/60 border border-orange-200/60 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">Upgrade Plan</h3>
              <p className="text-[10px] text-gray-600 font-medium truncate">Unlock features & grow your business</p>
            </div>
          </div>

          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black shadow-xs active:scale-95 transition shrink-0"
          >
            <span>View Plans</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2.5 border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Select KiranaFlow SaaS Plan</h3>
                <p className="text-[11px] text-gray-500">Secure Instant Checkout via Razorpay UPI / Cards</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* PRO */}
              <div className="p-3.5 rounded-2xl border-2 border-green-600 bg-green-50/40 relative space-y-2.5 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-gray-900 text-sm">PRO PLAN</h4>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-xl font-black text-green-700">₹499</span>
                    <span className="text-[10px] text-gray-500 font-bold">/ month</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-700 font-medium">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600 shrink-0" /> Up to 1,000 Products</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600 shrink-0" /> Up to 10 Staff Accounts</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleRazorpayCheckout('PRO')}
                  disabled={upgrading}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Zap className="w-3 h-3" />
                  {upgrading ? 'Processing...' : 'Pay ₹499'}
                </button>
              </div>

              {/* PREMIUM */}
              <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 relative space-y-2.5 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-gray-900 text-sm">PREMIUM PLAN</h4>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-xl font-black text-purple-800">₹999</span>
                    <span className="text-[10px] text-gray-500 font-bold">/ month</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-700 font-medium">
                    <li className="flex items-center gap-1"><Crown className="w-3 h-3 text-purple-600 shrink-0" /> Unlimited Products & Staff</li>
                    <li className="flex items-center gap-1"><Crown className="w-3 h-3 text-purple-600 shrink-0" /> AI / Voice Assistant</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleRazorpayCheckout('PREMIUM')}
                  disabled={upgrading}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Crown className="w-3 h-3" />
                  {upgrading ? 'Processing...' : 'Pay ₹999'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};