import React, { useState } from 'react';
import { NODE_URL, PYTHON_URL } from '../../config/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BillingPanel = ({ onClose }) => {
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
  const [selectedPlan, setSelectedPlan] = useState(user?.workspace?.subscription_tier && user?.workspace?.subscription_tier !== 'free_trial' ? user.workspace.subscription_tier : 'basic');
  const [billingCycle, setBillingCycle] = useState(user?.workspace?.billing_cycle || 'monthly');
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${PYTHON_URL}/api/auth/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle: billingCycle,
          countryCode: user?.countryCode || '+91'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const order = await response.json();

      const options = {
        key: 'rzp_test_T8cKAQqum29XJ9',
        amount: order.amount,
        currency: order.currency,
        name: 'CogniVault Renewal',
        description: `${selectedPlan.toUpperCase()} Plan - ${billingCycle.toUpperCase()}`,
        order_id: order.orderId,
        handler: async function (paymentResponse) {
          try {
            const verifyRes = await fetch(`${PYTHON_URL}/api/auth/renew-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentResponse,
                workspaceId: user?.workspaceId || user?.workspace?._id,
                plan: selectedPlan,
                billingCycle: billingCycle
              })
            });
            if (verifyRes.ok) {
              const data = await verifyRes.json();
              const updatedUser = { ...user, tier: selectedPlan, workspace: data.workspace };
              sessionStorage.setItem('cognivault_user', JSON.stringify(updatedUser));
              window.location.reload();
            } else {
              alert('Verification failed. Please contact support.');
            }
          } catch (err) {
            alert('Error verifying payment.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4F46E5'
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert('Error initiating payment');
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = () => {
    let monthly = selectedPlan === 'basic' ? 7999 : selectedPlan === 'moderate' ? 24999 : 39999;
    if (billingCycle === 'halfYearly') {
      const discounted = Math.round(monthly * 0.95);
      return `₹${(discounted * 6).toLocaleString('en-IN')} (₹${discounted.toLocaleString('en-IN')}/mo)`;
    }
    if (billingCycle === 'yearly') {
      const discounted = Math.round(monthly * 0.90);
      return `₹${(discounted * 12).toLocaleString('en-IN')} (₹${discounted.toLocaleString('en-IN')}/mo)`;
    }
    return `₹${monthly.toLocaleString('en-IN')} / month`;
  };

  const getExpiryInfo = () => {
    if (user?.tier === 'free_trial') return { formattedDate: null, status: 'trial' };
    
    const rawCreated = user?.workspace?.createdAt || user?.createdAt;
    const createdDate = rawCreated ? new Date(rawCreated) : new Date();
    const cycle = (user?.workspace?.billing_cycle || 'monthly').toLowerCase();
    const durationMonths = cycle === 'yearly' ? 12 : cycle === 'halfYearly' || cycle === 'halfyearly' ? 6 : 1;

    let expDate = user?.workspace?.subscriptionEndDate ? new Date(user.workspace.subscriptionEndDate) : null;
    if (!expDate) {
      expDate = new Date(createdDate);
      expDate.setMonth(expDate.getMonth() + durationMonths);
    }

    const formattedDate = expDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const diffMs = expDate.getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isRecentlyRenewed = daysLeft > 14;

    return {
      formattedDate,
      daysLeft,
      isExpired: daysLeft <= 0,
      isExpiringSoon: daysLeft > 0 && daysLeft <= 7,
      isRecentlyRenewed
    };
  };

  const expiry = getExpiryInfo();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Billing &amp; Subscription</h2>
        <p className="text-sm text-gray-400 mb-6">Manage your workspace tier, billing cycle, and renewals.</p>

        {/* Current Status & Expiry Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Current Tier</span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              {user?.tier || 'Free Trial'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Billing Cycle</span>
            <span className="text-sm font-medium text-white capitalize">{user?.workspace?.billing_cycle || 'Monthly'}</span>
          </div>
          {expiry.formattedDate && (
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-sm text-gray-300">Subscription Expiry Date</span>
              <span className={`text-sm font-bold font-mono ${expiry.isExpired ? 'text-rose-400' : expiry.isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'}`}>
                {expiry.formattedDate} {expiry.isExpired ? '(Expired)' : expiry.isExpiringSoon ? `(${expiry.daysLeft} days left)` : ''}
              </span>
            </div>
          )}
          
          {/* Renewal Status Confirmation Banner */}
          {expiry.isRecentlyRenewed && (
            <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Subscription Active &amp; Up to Date!</span>
            </div>
          )}
        </div>

        {/* Tier Selection */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Tier</label>
          <div className="space-y-2">
            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${selectedPlan === 'basic' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'}`}>
              <input type="radio" name="plan" checked={selectedPlan === 'basic'} onChange={() => setSelectedPlan('basic')} className="w-4 h-4 text-indigo-500 focus:ring-indigo-500" />
              <div className="ml-3">
                <span className="block text-sm font-bold">Basic Tier</span>
                <span className="block text-xs text-gray-400">Core AI & Document Intelligence (₹7,999/mo)</span>
              </div>
            </label>
            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${selectedPlan === 'moderate' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'}`}>
              <input type="radio" name="plan" checked={selectedPlan === 'moderate'} onChange={() => setSelectedPlan('moderate')} className="w-4 h-4 text-indigo-500 focus:ring-indigo-500" />
              <div className="ml-3">
                <span className="block text-sm font-bold">Moderate Tier</span>
                <span className="block text-xs text-gray-400">Basic + Risk, Forecaster & Redactor (₹24,999/mo)</span>
              </div>
            </label>
            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${selectedPlan === 'advanced' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'}`}>
              <input type="radio" name="plan" checked={selectedPlan === 'advanced'} onChange={() => setSelectedPlan('advanced')} className="w-4 h-4 text-indigo-500 focus:ring-indigo-500" />
              <div className="ml-3">
                <span className="block text-sm font-bold">Advanced Tier</span>
                <span className="block text-xs text-gray-400">All Modules + Oracle & Graph (₹39,999/mo)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Billing Duration</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${billingCycle === 'monthly' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('halfYearly')}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${billingCycle === 'halfYearly' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              6 Mo <span className="text-[10px] text-emerald-400 font-normal">(5% Off)</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${billingCycle === 'yearly' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              Annual <span className="text-[10px] text-emerald-400 font-normal">(10% Off)</span>
            </button>
          </div>
        </div>

        {/* Total & Checkout */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-xs text-gray-400 font-medium">Total Amount</span>
            <span className="block text-sm font-bold text-emerald-400">{getPriceDisplay()}</span>
          </div>
          <button
            onClick={handleRenew}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay & Renew'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BillingPanel;
