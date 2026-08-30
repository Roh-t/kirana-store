import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { razorpayService, loadRazorpayScript } from '../../services/razorpayService';
import { useAuth } from '../../context/AuthContext';
import { Package, Users, Zap, Check, ShieldCheck, Crown } from 'lucide-react';

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
      {/* SaaS Plan Banner */}
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

        <button
          onClick={() => setShowPlanModal(true)}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition shadow-2xs active:scale-95 shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          {sub.plan === 'FREE' ? 'Upgrade Plan' : 'Manage Subscription'}
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