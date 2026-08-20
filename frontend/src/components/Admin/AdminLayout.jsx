import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

const AdminLayout = () => {
  const navItems = [
    { name: 'Command Center', path: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Advertiser CRM', path: '/admin/advertisers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Client Manager', path: '/admin/clients', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Billing & Tiers', path: '/admin/billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'Support Tickets', path: '/admin/support', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { name: 'Enterprise Proposals', path: '/admin/enterprise', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  return (
    <div className="flex h-screen bg-[#030712] text-gray-300 font-sans overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Deep Mesh Background Gradients (Subdued for Professional UI) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none mix-blend-normal" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-violet-900/10 rounded-full blur-[140px] pointer-events-none mix-blend-normal" />
      <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-slate-800/20 rounded-full blur-[120px] pointer-events-none mix-blend-normal" />

      {/* Floating Sidebar Container */}
      <div className="p-6 pr-3 flex flex-col shrink-0 h-screen z-20">
        <aside className="w-[280px] h-full bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/5 rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
          
          {/* Subtle inner highlight */}
          <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />

          {/* Logo */}
          <div className="h-[88px] flex items-center px-8 border-b border-white/5 shrink-0 relative z-10">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <img src="/logo.jpg" alt="CogniVault Logo" className="w-10 h-10 object-contain rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-white/10" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">CogniVault</h1>
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Control</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2 relative z-10 scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group overflow-hidden
                  ${isActive 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-200'}
                `}
              >
                {({ isActive }) => (
                  <>
                    {/* Active State Background & Glow */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-violet-500/5 rounded-2xl border border-indigo-500/30" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                      </>
                    )}
                    
                    {/* Hover State Background */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
                    )}

                    <svg className={`w-5 h-5 relative z-10 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    <span className="relative z-10 tracking-wide">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Admin Profile */}
          <div className="p-6 shrink-0 relative z-10">
            <div className="flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 transition-colors cursor-pointer group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-xl border border-white/20">
                  JS
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Jiya System</p>
                <p className="text-[11px] text-emerald-400 font-semibold truncate tracking-wider uppercase mt-0.5">Super Admin</p>
              </div>
              <div className="flex flex-col gap-1">
                <Link to="/dashboard" className="text-gray-600 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-xl flex items-center justify-center" title="Go to Client View">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </Link>
                <button 
                  onClick={() => {
                    sessionStorage.removeItem('cognivault_token');
                    sessionStorage.removeItem('cognivault_user');
                    window.location.href = '/';
                  }}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-xl flex items-center justify-center" 
                  title="Log Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            </div>
          </div>

        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-6 pr-6 pb-6 pl-3">
        

        {/* Floating Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-[#0B0F19]/40 backdrop-blur-md border border-white/5 rounded-3xl p-10 relative z-20 shadow-2xl scrollbar-hide">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
