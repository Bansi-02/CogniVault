import { NODE_URL } from '../../config/api';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ currentTier: propTier }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
      if (user && user.workspaceId) {
        await fetch(`${NODE_URL}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: user.workspaceId,
            userId: user.id,
            userName: user.name,
            action: 'Logged Out',
            details: 'User initiated logout'
          })
        });
      }
    } catch (e) {
      console.error('Logout logging error:', e);
    }
    sessionStorage.removeItem('cognivault_token');
    sessionStorage.removeItem('cognivault_user');
    navigate('/');
  };

  const isDashboard = currentPath === '/dashboard' || currentPath === '/';
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
  const effectiveTier = isDashboard ? propTier : (user.isAdmin ? 3 : (user.tier === 'advanced' ? 3 : user.tier === 'moderate' ? 2 : (user.tier === 'basic' || user.tier === 'free_trial') ? 1 : 0));

  const activeClass = "flex items-center px-4 py-2 mx-4 bg-[#eef0ff] text-[#2c1fb0] font-bold rounded-[10px] transition-colors shadow-[0_2px_8px_rgba(44,31,176,0.06)] border border-[#e2e6ff] text-[13px]";
  const inactiveClass = "flex items-center px-4 py-2 mx-4 text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-[10px] transition-colors border border-transparent text-[13px]";

  const NavItem = ({ to, label, themeHex }) => {
    const isActive = currentPath === to || (currentPath === '/' && to === '/dashboard');
    return (
      <Link to={to} className={isActive ? activeClass : inactiveClass}>
        {themeHex ? (
          <span className="w-2 h-2 rounded-full mr-3 shadow-sm" style={{ backgroundColor: themeHex }}></span>
        ) : (
          <svg className="w-[18px] h-[18px] mr-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        )}
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar Panel */}
      <aside className={`bg-white border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] hidden md:flex flex-shrink-0 z-20 transition-all duration-300 overflow-hidden ${isOpen ? 'w-[240px] border-r' : 'w-0 border-r-0 opacity-0'}`}>
        <div className="w-[240px] flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-[85px] flex items-center px-6 shrink-0 gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <div className="flex flex-col mt-1">
               <span className="text-[22px] font-extrabold text-gray-900 tracking-tight leading-none mb-1.5" style={{ fontFamily: 'Quicksand, sans-serif' }}>CogniVault</span>
               <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase leading-none">Legal Intelligence</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-0.5 py-2">
            <NavItem to="/dashboard" label="Command Center" />
            <div className="px-8 mt-4 mb-2 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Core Platform</div>
            <NavItem to="/vault" label="Intelligence Vault" themeHex="#0f172a" />
            <div className="px-8 mt-4 mb-2 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">AI Modules</div>

            {/* Tier 1 Tools */}
            {effectiveTier >= 1 && (
              <>
                <NavItem to="/summary" label="Executive Summary" themeHex="#2563eb" />
                <NavItem to="/classification" label="AI Classification" themeHex="#2563eb" />
                <NavItem to="/semantic-search" label="Semantic Search" themeHex="#2563eb" />
                <NavItem to="/redlining" label="Automated Redlining" themeHex="#2563eb" />
              </>
            )}

            {/* Tier 2 Tools */}
            {effectiveTier >= 2 && (
              <>
                <NavItem to="/vendor-risk" label="Vendor Risk Screen" themeHex="#4338ca" />
                <NavItem to="/forecaster" label="Financial Forecaster" themeHex="#4338ca" />
                <NavItem to="/shield" label="Privilege Sentinel" themeHex="#4338ca" />
                <NavItem to="/redactor" label="Privacy Redactor" themeHex="#4338ca" />
              </>
            )}

            {/* Tier 3 Tools */}
            {effectiveTier >= 3 && (
              <>
                <NavItem to="/fraud-analytics" label="Forensic AI" themeHex="#312e81" />
                <NavItem to="/graph" label="Knowledge Graph" themeHex="#312e81" />
                <NavItem to="/drafter" label="AI Contract Drafting" themeHex="#312e81" />
                <NavItem to="/compliance-oracle" label="Compliance Oracle" themeHex="#312e81" />
              </>
            )}

            {/* Manager Security Tools */}
            {effectiveTier >= 2 && user?.role === 'manager' && (
              <NavItem to="/insider-threat" label="Insider Threat Monitor" themeHex="#dc2626" />
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 pb-4 shrink-0 pt-3 border-t border-gray-100">
            <div className="flex items-center px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
            {user?.isAdmin && (
              <Link to="/admin" className="flex items-center px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl transition-colors text-[13px] mb-1 mx-2">
                <svg className="w-[18px] h-[18px] mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Admin Control
              </Link>
            )}
            <Link to="/help-center" className="flex items-center px-4 py-2 text-gray-500 font-medium hover:text-gray-900 transition-colors text-[13px]">
              <svg className="w-[18px] h-[18px] mr-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Help Center
            </Link>
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-gray-500 font-medium hover:text-gray-900 transition-colors text-[13px] text-left focus:outline-none">
              <svg className="w-[18px] h-[18px] mr-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Self-contained Toggle Button — lives here, not in every page */}
      <div className="hidden md:flex relative z-30 items-center justify-center group">
        <div
          className={`absolute top-0 bottom-0 cursor-pointer ${isOpen ? 'w-6 -translate-x-1/2' : 'w-12 translate-x-0'}`}
          onClick={() => setIsOpen(!isOpen)}
        ></div>
        <div className={`absolute w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm text-gray-500 group-hover:text-gray-800 group-hover:bg-gray-50 transform pointer-events-none ${isOpen ? '-translate-x-1/2 opacity-0 group-hover:opacity-100' : 'translate-x-2 opacity-100'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            )}
          </svg>
        </div>
      </div>


    </>
  );
};

export default Sidebar;
