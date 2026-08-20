import { NODE_URL, PYTHON_URL } from '../../config/api';
import TeamSettings from './TeamSettings';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import BillingPanel from './BillingPanel';

const DashboardLayout = () => {
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
  const currentTier = user.isAdmin ? 3 : (user.tier === 'advanced' ? 3 : user.tier === 'moderate' ? 2 : (user.tier === 'basic' || user.tier === 'free_trial') ? 1 : 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [showBillingPanel, setShowBillingPanel] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTierName, setUpgradeTierName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const profileMenuRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setIsEditingName(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    const handleOpenBilling = () => setShowBillingPanel(true);
    window.addEventListener('open-billing-panel', handleOpenBilling);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('open-billing-panel', handleOpenBilling);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!user?.workspaceId) return;
    try {
      const res = await fetch(`${NODE_URL}/api/activity/${user.workspaceId}?limit=30`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    const syncWorkspace = async () => {
      if (!user?.workspaceId) return;
      try {
        const res = await fetch(`${NODE_URL}/api/workspace/${user.workspaceId}`);
        if (res.ok) {
          const freshWs = await res.json();
          const updatedUser = { ...user, workspace: freshWs, tier: freshWs.subscription_tier || user.tier };
          sessionStorage.setItem('cognivault_user', JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.error('Workspace sync error:', e);
      }
    };
    syncWorkspace();
  }, [user?.workspaceId]);

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.role, user?.workspaceId]);

  useEffect(() => {
    if (user?.tier === 'free_trial' && !user?.isAdmin) {
      let stored = sessionStorage.getItem('cognivault_trial_start');
      if (!stored) {
        stored = Date.now().toString();
        sessionStorage.setItem('cognivault_trial_start', stored);
      }
      const startTime = parseInt(stored, 10);

      const checkTrial = () => {
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed >= 180000) { // 3 minutes (180,000 ms)
          sessionStorage.removeItem('cognivault_user');
          sessionStorage.removeItem('cognivault_token');
          sessionStorage.removeItem('cognivault_trial_start');
          window.location.href = '/login?trialExpired=true';
        }
      };

      checkTrial();
      const trialCheckInterval = setInterval(checkTrial, 3000);
      
      return () => clearInterval(trialCheckInterval);
    }
  }, [user?.tier, user?.isAdmin]);

  const getSubscriptionExpiryInfo = () => {
    if (user?.tier === 'free_trial') return null;
    
    const rawCreated = user?.workspace?.createdAt || user?.createdAt;
    const createdDate = rawCreated ? new Date(rawCreated) : new Date();
    const cycle = (user?.workspace?.billing_cycle || user?.billing_cycle || 'monthly').toLowerCase();
    const durationMonths = cycle === 'yearly' ? 12 : cycle === 'halfyearly' ? 6 : 1;
    
    let expiryTime = user?.workspace?.subscriptionEndDate ? new Date(user.workspace.subscriptionEndDate).getTime() : null;
    if (!expiryTime) {
      const expDate = new Date(createdDate);
      expDate.setMonth(expDate.getMonth() + durationMonths);
      expiryTime = expDate.getTime();
    }

    const diffMs = expiryTime - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return { daysLeft, isExpired: daysLeft <= 0, isExpiringSoon: daysLeft <= 7 };
  };

  const expiryInfo = getSubscriptionExpiryInfo();

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`${PYTHON_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: newName })
      });
      if (res.ok) {
        const updatedUser = { ...user, name: newName };
        sessionStorage.setItem('cognivault_user', JSON.stringify(updatedUser));
        setIsEditingName(false);
        setShowProfileMenu(false);
      }
    } catch (e) {
      console.error('Failed to update name:', e);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cognivault_user');
    sessionStorage.removeItem('cognivault_token');
    window.location.href = '/login';
  };

  const ModuleCard = ({ title, description, isActive, requiredTier, buttonText, iconPath, linkTo, themeHex }) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!title.toLowerCase().includes(q)) return null;
    }
    
    // Calculate dynamic glows based on the specific tool's theme color
    const softBorder = isActive ? `${themeHex}33` : '#f3f4f6';
    const restingShadow = isActive ? `0 10px 30px ${themeHex}15` : '0 4px 20px rgba(0,0,0,0.03)';
    const glowShadow = isActive ? `0 0 35px ${themeHex}55, 0 10px 30px ${themeHex}33` : '0 10px 30px rgba(0,0,0,0.1)';

    return (
      <div
        className={`rounded-[24px] p-6 flex flex-col items-center text-center group transition-all duration-500 bg-white border-2 relative overflow-hidden`}
        style={{ 
          borderColor: softBorder, 
          boxShadow: restingShadow,
        }}
        onMouseEnter={(e) => {
          if(isActive) e.currentTarget.style.boxShadow = glowShadow;
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = restingShadow;
          e.currentTarget.style.transform = 'translateY(0px)';
        }}
      >
        {/* Animated Background Wash for Glow Effect */}
        {isActive && (
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle at top, ${themeHex}, transparent 80%)` }}
          />
        )}

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 relative z-10 ${!isActive ? 'bg-gray-200' : ''}`}
          style={isActive ? { 
            backgroundColor: themeHex,
            boxShadow: `0 8px 25px ${themeHex}80` // Intense glow right underneath the icon
          } : {}}
        >
          <svg className={`w-6 h-6 transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-[8deg] ${isActive ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
          </svg>
        </div>

        <h3 className="text-[20px] font-semibold text-gray-800 leading-tight tracking-tight mb-3 relative z-10">{title}</h3>
        <p className="text-[13px] text-gray-500 font-medium flex-1 mb-5 leading-relaxed px-2 relative z-10">{description}</p>

        {isActive ? (
          linkTo ? (
            <Link
              to={linkTo}
              className="w-full py-2.5 text-white text-[12px] font-bold rounded-xl transition-all tracking-wide hover:brightness-110 text-center relative z-10"
              style={{ 
                backgroundColor: themeHex,
                boxShadow: `0 4px 15px ${themeHex}66` // Button glow
              }}
            >
              {buttonText}
            </Link>
          ) : (
            <button
              className="w-full py-2.5 text-white text-[12px] font-bold rounded-xl transition-all tracking-wide hover:brightness-110 relative z-10"
              style={{ 
                backgroundColor: themeHex,
                boxShadow: `0 4px 15px ${themeHex}66`
              }}
            >
              {buttonText}
            </button>
          )
        ) : (
          <button 
            onClick={() => {
              const tierName = requiredTier === 1 ? 'Basic' : requiredTier === 2 ? 'Moderate' : 'Advanced';
              setUpgradeTierName(tierName);
              setShowUpgradeModal(true);
            }}
            className="w-full py-2.5 bg-gray-100 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 text-[12px] font-bold rounded-xl transition-colors tracking-wide flex items-center justify-center gap-2 outline-none group"
          >
            <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Upgrade
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans">
      {/* Sidebar — owns its own open/close toggle state */}
      <Sidebar currentTier={currentTier} />

      {/* Main Screen Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">

        {/* Subscription Expiry Alert Banner */}
        {expiryInfo && (expiryInfo.isExpiringSoon || expiryInfo.isExpired) && (
          <div className={`px-10 py-3 flex items-center justify-between text-xs font-bold border-b shadow-sm z-50 ${expiryInfo.isExpired ? 'bg-rose-600 text-white border-rose-700' : 'bg-amber-400 text-slate-950 border-amber-500'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>
                {expiryInfo.isExpired
                  ? 'Your subscription has EXPIRED. Please renew now to maintain uninterrupted access to all modules.'
                  : `Subscription Notice: Your workspace subscription expires in ${expiryInfo.daysLeft} day${expiryInfo.daysLeft > 1 ? 's' : ''}.`}
              </span>
            </div>
            <button
              onClick={() => setShowBillingPanel(true)}
              className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${expiryInfo.isExpired ? 'bg-white text-rose-700 hover:bg-gray-100' : 'bg-slate-950 text-white hover:bg-slate-900'}`}
            >
              Renew Now
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="pt-5 pb-8 flex items-center justify-between px-10 relative z-40">

          <div className="flex items-center gap-2 flex-1">
            <span className="text-[14px] font-bold text-gray-800 tracking-tight">{user?.workspace?.name || 'Workspace'}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            <span className="text-[14px] font-medium text-gray-500">Command Center</span>
          </div>

          <div className="flex items-center gap-8">
            
            <div className="relative w-80 lg:w-96 group hidden md:block mr-2">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search Command Center..."
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 text-[13px] transition-all shadow-sm hover:shadow hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>


            {/* Notification Bell (Managers Only) */}
            {user?.role === 'manager' && (
              <div className="relative" ref={notificationMenuRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`w-10 h-10 rounded-[14px] bg-white border flex items-center justify-center shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${showNotifications ? 'border-indigo-500 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:shadow hover:text-indigo-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {notifications.filter(n => n.action === 'Threat Detected').length > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-gray-800">Activity Log</h3>
                      <button onClick={fetchNotifications} className="text-xs text-indigo-600 hover:underline">Refresh</button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-4 text-xs text-gray-500 text-center">No activity yet.</div>
                    ) : (
                      <ul className="py-1">
                        {notifications.map(log => (
                          <li key={log._id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${log.action === 'Threat Detected' ? 'bg-red-50/50' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[13px] font-semibold ${log.action === 'Threat Detected' ? 'text-red-600' : 'text-gray-800'}`}>{log.action}</span>
                              <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-600 leading-tight">
                              <span className="font-medium text-gray-700">{log.userName}</span>
                              {log.details ? ` - ${log.details}` : ''}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`w-10 h-10 rounded-[14px] bg-white border flex items-center justify-center font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${showProfileMenu ? 'border-indigo-500 text-indigo-700' : 'border-gray-200 text-indigo-600 hover:border-indigo-200 hover:shadow hover:text-indigo-700'}`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-gray-50 group relative">
                    {!isEditingName ? (
                      <>
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-sm font-semibold text-gray-700 truncate pr-2">{user?.name || 'User'}</p>
                          <button onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setNewName(user?.name || ''); }} className="text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 p-1" autoFocus />
                        <div className="flex gap-2 justify-end">
                          <button onClick={(e) => { e.stopPropagation(); setIsEditingName(false); setShowProfileMenu(false); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                          <button onClick={(e) => { e.stopPropagation(); handleUpdateName(); }} className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded">Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="py-2">
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setShowProfileMenu(false);
                        setShowTeamSettings(true);
                      }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowTeamSettings(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Team &amp; Invites
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowBillingPanel(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Billing &amp; Subscription
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full mx-auto px-10 pt-2 pb-4 max-w-[1600px]">

          {/* Breadcrumbs */}


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">

              {/* TIER 1 */}
              <ModuleCard title="Executive Summary" description="AI-generated briefs for complex legal dockets." isActive={currentTier >= 1} requiredTier={1} buttonText="Launch Summaries" themeHex="#2563eb" iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" linkTo="/summary" />
              <ModuleCard title="AI Classification" description="Auto-tagging and categorization of incoming legal documents." isActive={currentTier >= 1} requiredTier={1} buttonText="Launch Classifier" themeHex="#2563eb" iconPath="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" linkTo="/classification" />
              <ModuleCard title="Semantic Search" description="Search across contracts using natural language and intent." isActive={currentTier >= 1} requiredTier={1} buttonText="Launch Search" themeHex="#2563eb" iconPath="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" linkTo="/semantic-search" />
              <ModuleCard title="Automated Redlining" description="Detect deviations from standard clause playbooks." isActive={currentTier >= 1} requiredTier={1} buttonText="Launch Redliner" themeHex="#2563eb" iconPath="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" linkTo="/redlining" />

              {/* TIER 2 */}
              <ModuleCard title="Vendor Risk Screen" description="Assess vendor compliance and regulatory risk profiles." isActive={currentTier >= 2} requiredTier={2} buttonText="Launch Scanner" themeHex="#4338ca" iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" linkTo="/vendor-risk" />
              <ModuleCard title="Financial Forecaster" description="Predict litigation costs and settlement probabilities." isActive={currentTier >= 2} requiredTier={2} buttonText="Launch Forecaster" themeHex="#4338ca" iconPath="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" linkTo="/forecaster" />
              <ModuleCard title="Privilege Sentinel" description="Monitor emails/chats for compliance and policy breaches." isActive={currentTier >= 2} requiredTier={2} buttonText="Launch Shield" themeHex="#4338ca" iconPath="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" linkTo="/shield" />
              <ModuleCard title="Privacy Redactor" description="Automatically scan and redact sensitive PII before sharing." isActive={currentTier >= 2} requiredTier={2} buttonText="Launch Redactor" themeHex="#4338ca" iconPath="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" linkTo="/redactor" />

              {/* TIER 3 */}
              <ModuleCard title="Forensic AI" description="Detect anomalies and hidden patterns in financial documents." isActive={currentTier >= 3} requiredTier={3} buttonText="Launch Forensics" themeHex="#312e81" iconPath="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" linkTo="/fraud-analytics" />
              <ModuleCard title="Knowledge Graph" description="Visualize relationships between entities across all contracts." isActive={currentTier >= 3} requiredTier={3} buttonText="Launch Graph" themeHex="#312e81" iconPath="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" linkTo="/graph" />
              <ModuleCard title="AI Contract Drafting" description="Generate compliant contract clauses using fine-tuned LLMs." isActive={currentTier >= 3} requiredTier={3} buttonText="Launch Drafter" themeHex="#312e81" iconPath="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" linkTo="/drafter" />
              <ModuleCard title="Compliance Oracle" description="Query global regulatory changes and impact assessments." isActive={currentTier >= 3} requiredTier={3} buttonText="Launch Oracle" themeHex="#312e81" iconPath="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" linkTo="/compliance-oracle" />
            </div>
        </main>

        {showTeamSettings && <TeamSettings onClose={() => setShowTeamSettings(false)} />}

        {showBillingPanel && <BillingPanel onClose={() => setShowBillingPanel(false)} />}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center animate-in zoom-in-95 duration-200 font-sans">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Feature Locked</h2>
            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
              This feature is available on the <strong>{upgradeTierName === 'Basic' ? 'Basic, Moderate and Advanced' : upgradeTierName === 'Moderate' ? 'Moderate and Advanced' : 'Advanced'} Tier</strong>. Please contact your admin to upgrade your plan and unlock this module.
            </p>
            <div className="flex flex-col gap-3">
              <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-left">
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-2">Contact Your Admin</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Please reach out to your workspace admin or manager to request an upgrade to the <strong className="text-white">{upgradeTierName === 'Basic' ? 'Basic, Moderate or Advanced' : upgradeTierName === 'Moderate' ? 'Moderate or Advanced' : 'Advanced'} Tier</strong> and unlock this module.
                </p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;
