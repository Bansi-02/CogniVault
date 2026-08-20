import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

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
const FloatingInput = ({ id, label, type = 'text', value, onChange, error, rightElement }) => (
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
      className={`absolute left-4 top-1.5 text-xs font-semibold transition-all pointer-events-none
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal
        peer-focus:top-1.5 peer-focus:text-xs peer-focus:font-semibold
        ${error ? 'text-red-400' : 'text-gray-400 peer-focus:text-indigo-400'}`}
    >
      {label}
    </label>
    {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
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

/* ══════════════════════════════════════════════ */
const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode || 'login'); // 'login' | 'trial' | 'otp'
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };

  useEffect(() => {
    if (location.state?.mode && location.state.mode !== mode) {
      setMode(location.state.mode);
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('trialExpired') === 'true') {
      setServerError('Your 3-minute Free Trial has expired. Please contact sales to upgrade.');
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (sessionStorage.getItem('cognivault_token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digit OTP
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    let value = e.target.value;
    if (field === 'email') value = value.replace(/\s/g, '');
    setForm(f => ({ ...f, [field]: value }));
    setErrors(er => ({ ...er, [field]: '' }));
    setServerError('');
  };

  const handleOtpChange = (index, value) => {
    value = value.replace(/\D/g, ''); // Only digits
    if (value.length > 1) value = value.slice(0, 1);
    if (value === '' && document.getElementById(`otp-${index}`).value === '') {
       // Allow clearing
    } else if (!value) return; // Ignore if they typed letters that got stripped to empty
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const validate = () => {
    const errs = {};
    if (mode === 'trial' && !form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (mode === 'login' && !form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    setServerError('');
    try {
      if (mode === 'login') {
        const res = await fetch(`${PYTHON_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        if (data.requirePasswordChange) {
          sessionStorage.setItem('temp_cognivault_token', data.token);
          sessionStorage.setItem('temp_cognivault_user', JSON.stringify(data.user));
          setMode('set-password');
          setSuccess('');
        } else {
          sessionStorage.setItem('cognivault_token', data.token);
          sessionStorage.setItem('cognivault_user', JSON.stringify(data.user));
          if (data.user?.tier === 'free_trial' || data.user?.workspace?.subscription_tier === 'free_trial') {
            sessionStorage.setItem('cognivault_trial_start', Date.now().toString());
          }
          if (data.user.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } 
      else if (mode === 'forgot') {
        const res = await fetch(`${PYTHON_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to process request');
        
        setSuccess(data.message);
        setMode('login');
      }
      else if (mode === 'trial') {
        const res = await fetch(`${PYTHON_URL}/api/auth/request-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
        
        setMode('otp');
        setSuccess('Verification code sent to your email!');
      }
      else if (mode === 'otp') {
        const enteredOtp = otp.join('');
        const res = await fetch(`${PYTHON_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, otp: enteredOtp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invalid verification code');
        
        setSuccess('Verified! Starting your free trial...');
        sessionStorage.setItem('cognivault_token', data.token);
        sessionStorage.setItem('cognivault_user', JSON.stringify(data.user));
        sessionStorage.setItem('cognivault_trial_start', Date.now().toString());
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setServerError(err.message || 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      const user = JSON.parse(sessionStorage.getItem('temp_cognivault_user'));
      const res = await fetch(`${PYTHON_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword: form.password }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      
      // Promote tokens
      sessionStorage.setItem('cognivault_token', sessionStorage.getItem('temp_cognivault_token'));
      sessionStorage.setItem('cognivault_user', sessionStorage.getItem('temp_cognivault_user'));
      sessionStorage.removeItem('temp_cognivault_token');
      sessionStorage.removeItem('temp_cognivault_user');
      
      if (user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch(err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setForm({ name: '', email: '', password: '' });
    setOtp(['', '', '', '', '', '']);
    setErrors({});
    setServerError('');
    setSuccess('');
    setShowPw(false);
  };

  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle} className="text-gray-400 hover:text-white transition-colors p-1">
      {show
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      }
    </button>
  );

  return (
    <div className="min-h-screen bg-[#080c18] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <ParticleCanvas />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-900/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <button onClick={handleGoHome} className="flex items-center justify-center gap-3 mb-8 group w-fit mx-auto cursor-pointer border-none bg-transparent outline-none">
          <img src="/logo.jpg" alt="CogniVault Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-indigo-500/30" />
          <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-indigo-300 transition-colors">CogniVault</span>
        </button>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          
          {mode !== 'otp' && (
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('trial')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'trial' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-white'}`}
              >
                Start Free Trial
              </button>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">
              {mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Reset Password' : mode === 'trial' ? 'Start your trial' : mode === 'set-password' ? 'Set Permanent Password' : 'Verify your email'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access your intelligence hub.'
                : mode === 'forgot'
                ? 'Enter your email to receive a temporary password.'
                : mode === 'trial'
                ? 'Enter your work email to receive a verification code.'
                : mode === 'set-password'
                ? 'You are logging in with a temporary password. Please set a new permanent password to secure your account.'
                : `We've sent a 6-digit code to ${form.email}`
              }
            </p>
          </div>

                    {mode === 'set-password' && (
            <form onSubmit={handleSetPassword} className="flex flex-col gap-5">
              <FloatingInput
                id="new-password" label="New Password" type={showPw ? "text" : "password"}
                value={form.password} onChange={setField('password')} error={errors.password}
                rightElement={<EyeBtn show={showPw} toggle={() => setShowPw(!showPw)} />}
              />
              {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full bg-white hover:bg-gray-200 text-black py-3.5 rounded-xl font-bold shadow-lg shadow-white/20 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Set Password & Login'}
              </button>
            </form>
          )}
          
          {mode !== 'set-password' && (<>
            {success && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-emerald-400">{success}</p>
            </div>
          )}

          {serverError && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-red-400">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {mode === 'otp' ? (
              <div className="flex justify-between gap-2 py-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
                  />
                ))}
              </div>
            ) : (
              <>
                {mode === 'trial' && (
                  <FloatingInput id="name" label="Full Name" value={form.name} onChange={setField('name')} error={errors.name} />
                )}
                <FloatingInput id="email" label="Work Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} />
                {mode === 'login' && (
                  <FloatingInput
                    id="password"
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={setField('password')}
                    error={errors.password}
                    rightElement={<EyeBtn show={showPw} toggle={() => setShowPw(s => !s)} />}
                  />
                )}
              </>
            )}

            {mode === 'trial' && (
              <p className="text-xs text-orange-300 font-medium bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/20 text-center">
                Note: Free trial access is limited to exactly 3 minutes and a single document upload.
              </p>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'otp' && otp.some(d => !d))}
              className="w-full py-3.5 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg shadow-white/20 hover:shadow-white/30 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>
                : mode === 'login' ? 'Sign In to CogniVault →' 
                : mode === 'forgot' ? 'Send Temporary Password →'
                : mode === 'trial' ? 'Send Verification Code →'
                : 'Verify & Start Trial →'
              }
            </button>

            {mode === 'otp' && (
              <p className="text-center text-sm text-gray-400 mt-4">
                Didn't receive it? <button type="button" className="text-indigo-400 font-bold hover:text-indigo-300">Resend Code</button>
              </p>
            )}

          </form>

          {mode !== 'otp' && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <p className="text-center text-sm text-gray-400">
                {mode === 'login' ? "Want to try it out? " : mode === 'forgot' ? "Remembered your password? " : 'Already a client? '}
                <button onClick={() => switchMode(mode === 'login' ? 'trial' : 'login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                  {mode === 'login' ? 'Start Free Trial' : 'Sign in'}
                </button>
              </p>
            </>
          )}
          </>)}
        </div>

        <div className="flex justify-center mt-8">
          <button onClick={handleGoHome} className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-lg shadow-black/20 text-xs font-semibold text-gray-400 hover:text-white cursor-pointer outline-none">
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to home page
          </button>
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

export default Auth;
