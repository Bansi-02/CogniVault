import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c18]/90 backdrop-blur-xl border-b border-white/5 shadow-xl' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="CogniVault Logo" className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-indigo-500/20" />
          <span className="text-lg font-extrabold tracking-tight text-white">CogniVault</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Link to="/" className={`px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/' ? 'text-white font-medium hover:bg-white/5' : 'text-gray-400 font-medium hover:text-white hover:bg-white/5'}`}>
            Home
          </Link>
          <Link to="/features" className={`px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/features' ? 'text-white font-medium hover:bg-white/5' : 'text-gray-400 font-medium hover:text-white hover:bg-white/5'}`}>
            Features
          </Link>

          <Link to="/pricing" className={`px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/pricing' ? 'text-white font-medium hover:bg-white/5' : 'text-gray-400 font-medium hover:text-white hover:bg-white/5'}`}>
            Pricing
          </Link>
          <Link to="/why-cognivault" className={`px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/why-cognivault' ? 'text-white font-medium hover:bg-white/5' : 'text-gray-400 font-medium hover:text-white hover:bg-white/5'}`}>
            Why CogniVault
          </Link>
          <Link to="/partnerships" className={`px-4 py-2 rounded-xl transition-all duration-300 ${location.pathname === '/partnerships' ? 'text-white font-medium hover:bg-white/5' : 'text-gray-400 font-medium hover:text-white hover:bg-white/5'}`}>
            Partnerships
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {sessionStorage.getItem('cognivault_user') ? (
            <Link to="/dashboard" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 border border-indigo-500 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
              Go to Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300">
                Sign In
              </Link>
              <Link to="/login" state={{ mode: 'trial' }} className="px-5 py-2 text-sm font-bold text-white bg-white/5 border border-white/20 rounded-xl backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all shadow-lg shadow-black/20">
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
