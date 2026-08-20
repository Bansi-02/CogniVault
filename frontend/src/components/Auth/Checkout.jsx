import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

/* ── Canvas Particle Background ── */
const ParticleCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const N = 80;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129,140,248,0.7)';
        ctx.fill();
        pts.forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.18 - d / 130 * 0.18})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
};

/* ── Floating Label Input (dark glass version) ── */
const FloatingInput = ({ id, label, type = 'text', value, onChange, error }) => (
  <div className="relative">
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      autoComplete="off"
      className={`peer w-full px-4 pt-5 pb-2 bg-white/5 border rounded-xl text-sm text-white outline-none transition-all
        placeholder-transparent focus:bg-white/10
        ${error
          ? 'border-red-400/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
          : 'border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20'
        }`}
    />
    <label
      htmlFor={id}
      className={`absolute left-4 top-1.5 text-[11px] font-semibold transition-all pointer-events-none
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal
        peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-semibold
        ${error ? 'text-red-400' : 'text-gray-400 peer-focus:text-indigo-400'}`}
    >
      {label}
    </label>
    {error && (
      <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const planParam = queryParams.get('plan') || 'basic';
  const billingParam = queryParams.get('billing') || 'monthly';

  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };
  const [serverError, setServerError] = useState('');
  const [successMode, setSuccessMode] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', countryCode: '+91' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const setField = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phone') {
      // Strip anything that is not a digit, space, or hyphen
      value = value.replace(/[^\d\s-]/g, '');
    }
    setForm(f => ({ ...f, [field]: value }));
    setErrors(er => ({ ...er, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.company.trim()) errs.company = 'Company name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    const fullPhone = `${form.countryCode}${form.phone.replace(/[\s-]/g, '')}`;
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\+\d{10,15}$/.test(fullPhone)) errs.phone = 'Enter a valid phone number';
    return errs;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    setServerError('');
    
    try {
      // Step 1: Create Order
      const { data } = await axios.post(`${PYTHON_URL}/api/auth/create-order`, {
        plan: planParam,
        billingCycle: billingParam,
        countryCode: form.countryCode
      });

      // Razorpay requires the exact '+' sign when using country codes
      // e.g., '+919876543210'
      const cleanPhone = form.phone.replace(/\D/g, '');
      const formattedPhone = `${form.countryCode}${cleanPhone}`;

      const options = {
        key: 'rzp_test_T8cKAQqum29XJ9', // Would use import.meta.env.VITE_RAZORPAY_KEY in prod
        amount: data.amount,
        currency: data.currency,
        name: 'CogniVault',
        description: `Subscription: ${planParam.toUpperCase()} (${billingParam})`,
        order_id: data.orderId,
        handler: async function (response) {
          // Step 2: Verify Payment and Create User
          try {
            await axios.post(`${PYTHON_URL}/api/auth/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              name: form.name,
              email: form.email,
              company: form.company,
              plan: planParam,
              billingCycle: billingParam,
              countryCode: form.countryCode
            });
            setPaymentDetails({
              transactionId: response.razorpay_payment_id,
              amount: data.amount / 100,
              date: new Date().toLocaleDateString('en-GB'),
              isExisting: verifyRes.data?.isExistingUser || false
            });
            setSuccessMode(true);
            setLoading(false);
          } catch (verifyErr) {
            setServerError(verifyErr.response?.data?.message || 'Payment verification failed.');
            setLoading(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: formattedPhone,
        },
        readonly: {
          email: true,
          name: true
        },
        theme: {
          color: "#4F46E5", // Indigo to match brand
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setServerError(response.error.description);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong creating the order.');
      setLoading(false);
    }
  };

  if (successMode) {
    return (
      <div className="min-h-screen bg-[#080c18] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
        <ParticleCanvas />
        <div className="bg-[#0b101d]/80 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full text-center border border-white/10 relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black mb-2">Payment Successful</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            {paymentDetails?.isExisting ? (
              <>Your subscription for <strong className="text-white">{form.company}</strong> has been successfully extended. An official electronic payment receipt has been emailed to <strong className="text-white">{form.email}</strong>. Please log in using your existing account password.</>
            ) : (
              <>Your account is ready. Temporary login credentials have been securely emailed to <strong className="text-white">{form.email}</strong>.</>
            )}
          </p>
          
          {/* Payment Receipt */}
          {paymentDetails && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 text-left">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Official Receipt</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-gray-400">Billed To</span>
                  <div className="text-right">
                    <div className="text-white font-bold">{form.company}</div>
                    <div className="text-xs text-gray-500">{form.email}</div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Billed By</span>
                  <span className="text-indigo-400 font-bold">CogniVault</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-gray-400">Transaction ID</span>
                  <span className="text-white font-mono">{paymentDetails.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{paymentDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subscription</span>
                  <span className="text-white capitalize">{planParam} Tier ({billingParam.replace('halfYearly', '6 Months').replace('yearly', 'Annual')})</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-white/10 mt-3">
                  <span className="text-gray-300 font-bold">Total Paid</span>
                  <span className="text-emerald-400 font-bold">₹{paymentDetails.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center gap-2 text-indigo-300 text-xs font-medium text-center">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>An official electronic payment receipt has been sent to <strong>{form.email}</strong></span>
            </div>
            <Link to="/login" className="w-full py-4 bg-white text-black font-extrabold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-gray-200 transition-colors flex items-center justify-center">
              Proceed to Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get plan styling dynamically
  const getPrice = (plan, billing) => {
    let basePrice = plan === 'basic' ? 7999 : plan === 'moderate' ? 24999 : 39999;
    if (billing === 'halfYearly') return Math.round(basePrice * 6 * 0.95);
    if (billing === 'yearly') return Math.round(basePrice * 12 * 0.90);
    return basePrice;
  };

  const currentPrice = getPrice(planParam, billingParam).toLocaleString('en-IN');
  const billingText = billingParam === 'monthly' ? 'per month' : billingParam === 'halfYearly' ? 'total for 6 months' : 'total for 1 year';

  const planData = {
    basic: { 
      name: 'Basic Tier', 
      price: '₹' + currentPrice,
      features: ['Secure Intelligence Vault', 'AI Document Classification', 'Semantic Search (RAG)', 'Automated Redlining']
    },
    moderate: { 
      name: 'Moderate Tier', 
      price: '₹' + currentPrice,
      features: ['Everything in Basic Tier', 'Vendor Risk Screening', 'Financial Forecaster', 'Privilege Sentinel', 'Smart Invoice OCR']
    },
    advanced: { 
      name: 'Advanced Tier', 
      price: '₹' + currentPrice,
      features: ['Everything in Moderate Tier', 'Financial Forensic AI', 'Global Knowledge Graph', 'Generative Contract Drafting', 'Live Compliance Oracle']
    },
    enterprise: { 
      name: 'Enterprise', 
      price: 'Custom',
      features: ['Everything in Advanced Tier', 'Self-Hosted Deployment', 'Dedicated Account Manager', 'Custom Model Fine-Tuning', 'Unlimited Storage']
    }
  }[planParam] || { 
    name: 'Basic Tier', 
    price: '₹' + '7,999',
    features: ['Secure Intelligence Vault', 'AI Document Classification', 'Semantic Search (RAG)', 'Automated Redlining']
  };

  return (
    <div className="print:hidden min-h-screen bg-[#080c18] flex items-center justify-center p-6 lg:p-12 relative overflow-hidden font-sans">
      <ParticleCanvas />
      
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Back Button */}
      <div className="absolute top-6 left-6 z-50 animate-in fade-in duration-500">
        <button onClick={handleGoHome} className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-semibold text-sm transition-colors w-max group cursor-pointer border-none bg-transparent outline-none">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg backdrop-blur-md">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          <span className="group-hover:translate-x-1 transition-transform hidden sm:inline">Back to Home</span>
        </button>
      </div>
      
      <div className="w-full max-w-4xl relative z-10 flex flex-col">
        {/* Main Page Title */}
        <div className="text-center mb-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Secure Checkout</h1>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-8">
        {/* Left Side: Order Summary */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col relative">
          
          <div className="flex-1 flex flex-col justify-center pt-10">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-8">Order Summary</h3>
            <h1 className="text-4xl font-black text-white mb-2">{planData.name}</h1>
            <div className="flex items-baseline gap-2 mb-12 flex-wrap">
              <span className="text-5xl font-black text-white">{planData.price}</span>
              {planParam !== 'enterprise' && <span className="text-gray-400 font-medium">{billingText}</span>}
            </div>

            <ul className="space-y-4">
              {planData.features.map((feature, idx) => (
                <li key={idx} className="flex gap-3 text-gray-300 items-start">
                  <svg className={`w-5 h-5 shrink-0 mt-0.5 ${idx === 0 && planParam !== 'basic' ? 'text-emerald-400' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={idx === 0 && planParam !== 'basic' ? 'font-bold text-white' : ''}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Checkout Form */}
        <div className="flex-1 bg-[#0b101d]/90 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
          
          <h2 className="text-2xl font-black text-white mb-6">Complete Registration</h2>
          
          <form onSubmit={handleCheckout} className="space-y-5">
            
            <FloatingInput
              id="name"
              label="Full Name"
              value={form.name}
              onChange={setField('name')}
              error={errors.name}
            />

            <FloatingInput
              id="company"
              label="Company Name"
              value={form.company}
              onChange={setField('company')}
              error={errors.company}
            />

            <FloatingInput
              id="email"
              label="Work Email"
              type="email"
              value={form.email}
              onChange={setField('email')}
              error={errors.email}
            />

            <div className="flex gap-3">
              <div className="w-[120px] relative">
                <select
                  value={form.countryCode}
                  onChange={setField('countryCode')}
                  className="w-full h-[52px] px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer hover:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                >
                  <option value="+91" className="bg-[#0b101d]">IN (+91)</option>
                  <option value="+1" className="bg-[#0b101d]">US (+1)</option>
                  <option value="+44" className="bg-[#0b101d]">UK (+44)</option>
                  <option value="+61" className="bg-[#0b101d]">AU (+61)</option>
                  <option value="+971" className="bg-[#0b101d]">AE (+971)</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="flex-1">
                <FloatingInput
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={setField('phone')}
                  error={errors.phone}
                />
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-sm">Payment Method</span>
                <span className="bg-[#1a202c] px-3 py-1 rounded border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-1">
                  Razorpay (Test)
                </span>
              </div>
              <p className="text-xs text-gray-500">You will be redirected to Razorpay's secure checkout. No real money will be charged in Test Mode.</p>
            </div>

            {serverError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{serverError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-white hover:bg-gray-200 text-black rounded-xl font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <span>Complete Checkout via Razorpay</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </>
              )}
            </button>
            
          </form>
          
        </div>
      </div>
      </div>

      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center">
          <div className="flex items-center gap-4 animate-pop">
            <img src="/logo.jpg" alt="CogniVault Logo" className="w-20 h-20 object-contain rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.5)]" />
            <span className="text-5xl font-black text-white tracking-tight">CogniVault</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
