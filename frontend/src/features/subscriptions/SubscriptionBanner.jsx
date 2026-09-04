import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { razorpayService, loadRazorpayScript } from '../../services/razorpayService';
import { useAuth } from '../../context/AuthContext';
import { Package, Users, Zap, Check, ShieldCheck, Crown, ArrowRight, ChevronRight } from 'lucide-react';

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

      // 1. Load Razorpay Checkout Script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setUpgrading(false);
        return;
      }

      // 2. Create Razorpay Order on Backend
      const orderRes = await razorpayService.createSubscriptionOrder(storeId, targetPlan);
      const { orderId, amount, currency, keyId, storeName, plan } = orderRes.data;

      // 3. Configure Razorpay Popup Options
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
            // 4. Verify HMAC Signature on Backend
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
          ondismiss: function () {
            setUpgrading(false);
          }
        }
      };

      // 4. Open Razorpay Checkout Modal
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.message || 'Failed to initiate payment checkout');
      setUpgrading(false);
    }
  };

  if (loading || !data) return null;

  const sub = data.subscription;
  const usage = data.usage;

  return (
    <>
      <div className="w-full flex flex-col gap-3.5 mb-3">
        {/* 1. 14-DAY Free Trial Banner */}
        <div className="w-full rounded-[24px] bg-white border border-gray-100 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <Crown className="w-6 h-6 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">14-DAY</div>
                <div className="text-base sm:text-lg font-black text-gray-900 leading-tight">Free Trial</div>
                <div className="text-xs text-gray-500 font-medium">Explore all premium features</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-2 left-0 text-xs select-none pointer-events-none opacity-80">
                ✨
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black transition active:scale-95"
              >
                <span>Upgrade Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-gray-900">7 days left</span>
              <span className="text-gray-400">Get Pro for more power</span>
            </div>
          </div>
        </div>

        {/* 2. Usage Stats (Products & Staff Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Products Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black text-gray-900">Products</span>
                </div>
                <button className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{usage.products.current}</span>
                <span className="text-base font-bold text-gray-400">/</span>
                <span className="text-base font-bold text-gray-600">{usage.products.max === -1 ? '∞' : usage.products.max}</span>
              </div>

              <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: usage.products.max === -1 ? '100%' : `${Math.min(100, (usage.products.current / Math.max(usage.products.max, 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-3 text-[11px] font-medium text-gray-500">
              Add and manage your products
            </div>
          </div>

          {/* Staff Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black text-gray-900">Staff</span>
                </div>
                <button className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{usage.staff.current}</span>
                <span className="text-base font-bold text-gray-400">/</span>
                <span className="text-base font-bold text-gray-600">{usage.staff.max === -1 ? '∞' : usage.staff.max}</span>
              </div>

              <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: usage.staff.max === -1 ? '100%' : `${Math.min(100, (usage.staff.current / Math.max(usage.staff.max, 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-3 text-[11px] font-medium text-gray-500">
              Manage your team and roles
            </div>
          </div>
        </div>

        {/* 3. Orange Upgrade Banner */}
        <div className="w-full rounded-[24px] bg-gradient-to-r from-amber-100/70 via-orange-100/80 to-amber-200/60 border border-orange-200/60 p-4 sm:p-5 shadow-[0_4px_20px_rgba(251,146,60,0.1)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">Upgrade Plan</h3>
              <p className="text-xs text-gray-600 font-medium">Unlock more features and grow your business</p>
            </div>
          </div>

          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-xs active:scale-95 transition shrink-0"
          >
            <span>View Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Select KiranaFlow SaaS Plan</h3>
                <p className="text-xs text-gray-500">Secure Instant Checkout via Razorpay UPI / Cards</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">
                ✕
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PRO PLAN */}
              <div className="p-4 rounded-2xl border-2 border-green-600 bg-green-50/40 relative space-y-3 flex flex-col justify-between">
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-green-600 text-white text-[10px] font-black rounded-full uppercase">
                  MOST POPULAR
                </span>
                <div>
                  <h4 className="font-black text-gray-900 text-base">PRO PLAN</h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-green-700">₹499</span>
                    <span className="text-xs text-gray-500 font-bold">/ month</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-700 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" /> Up to 1,000 Products
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" /> Up to 10 Staff Accounts
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" /> Live Queue & Sound Alerts
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" /> Dynamic UPI QR Payments
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleRazorpayCheckout('PRO')}
                  disabled={upgrading}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {upgrading ? 'Processing...' : 'Pay ₹499 with Razorpay'}
                </button>
              </div>

              {/* PREMIUM PLAN */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 relative space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-gray-900 text-base">PREMIUM PLAN</h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-purple-800">₹999</span>
                    <span className="text-xs text-gray-500 font-bold">/ month</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-700 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Unlimited Products
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Unlimited Staff Accounts
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-purple-600 shrink-0" /> AI / Voice Order Assistant
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Multi-Store Chain Management
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleRazorpayCheckout('PREMIUM')}
                  disabled={upgrading}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition disabled:opacity-50"
                >
                  <Crown className="w-3.5 h-3.5" />
                  {upgrading ? 'Processing...' : 'Pay ₹999 with Razorpay'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center font-medium">
              🔒 256-Bit SSL Encrypted Payment powered by Razorpay India.
            </p>
          </div>
        </div>
      )}
    </>
  );
};