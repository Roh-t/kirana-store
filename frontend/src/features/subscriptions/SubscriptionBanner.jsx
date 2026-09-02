import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { razorpayService, loadRazorpayScript } from '../../services/razorpayService';
import { useAuth } from '../../context/AuthContext';
import { Package, Users, Zap, Check, ShieldCheck, Crown, ArrowUpRight } from 'lucide-react';

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
      <div className="w-full rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-1.5 sm:p-2 shadow-[0_8px_20px_rgba(16,185,129,0.08)] mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
          <div className="rounded-[16px] bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 px-2 py-2.5 flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">14-Day</div>
              <div className="text-sm font-black text-gray-900 leading-none">Free Trial</div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white border border-emerald-100 px-2 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-black text-gray-900">Products</div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-black text-emerald-700">
              <span>{usage.products.current}</span>
              <span className="text-gray-400">/</span>
              <span>{usage.products.max === -1 ? '∞' : usage.products.max}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                style={{ width: `${Math.min(100, (usage.products.current / Math.max(usage.products.max, 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-[16px] bg-white border border-emerald-100 px-2 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-black text-gray-900">Staff</div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-black text-emerald-700">
              <span>{usage.staff.current}</span>
              <span className="text-gray-400">/</span>
              <span>{usage.staff.max === -1 ? '∞' : usage.staff.max}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                style={{ width: `${Math.min(100, (usage.staff.current / Math.max(usage.staff.max, 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowPlanModal(true)}
          className="mt-1.5 w-full flex items-center justify-between rounded-[16px] bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500 px-2.5 py-2 shadow-[0_8px_20px_rgba(251,146,60,0.25)] text-white font-black text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
            <div>
              <div className="text-sm">Upgrade Plan</div>
              <div className="text-[9px] font-medium text-orange-50">Unlock more features and grow your business</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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