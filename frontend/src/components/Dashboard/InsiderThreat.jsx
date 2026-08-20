import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const InsiderThreat = () => {  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
        const res = await axios.get(`${NODE_URL}/api/insider-threats/${user.workspaceId}`);
        setThreats(res.data);
      } catch (error) {
        console.error("Error fetching threats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchThreats();
    
    const interval = setInterval(fetchThreats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      <Sidebar currentTier={2} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30 flex items-center justify-center shadow-lg relative">
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-white border border-gray-100 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              </span>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Insider Threat Monitor</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-10 bg-[#f8fafc]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Security Sentry <span className="text-red-600">Active</span></h2>
              <p className="text-gray-500 text-sm">Monitoring vault access velocity. Accounts displaying data exfiltration behavior are automatically suspended.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">Blocked Exfiltration Attempts</h3>
                <div className="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-bold uppercase rounded-lg border border-green-200 shadow-sm">
                  System Secure
                </div>
              </div>
              
              {loading ? (
                <div className="p-12 text-center text-gray-400 text-sm font-medium">Loading incident logs...</div>
              ) : threats.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 mb-4 shadow-sm">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">No Threats Detected</h3>
                  <p className="text-gray-500 text-sm">All team members are operating within normal security thresholds.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 bg-white">
                        <th className="px-6 py-4 font-bold">Timestamp</th>
                        <th className="px-6 py-4 font-bold">User</th>
                        <th className="px-6 py-4 font-bold">Action Trigger</th>
                        <th className="px-6 py-4 font-bold">Velocity</th>
                        <th className="px-6 py-4 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {threats.map((threat) => (
                        <tr key={threat._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(threat.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-800 text-[13px]">{threat.userName}</div>
                            <div className="text-[11px] text-gray-500">{threat.userEmail}</div>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-semibold text-red-600">
                            {threat.action}
                          </td>
                          <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">
                            <span className="text-gray-800 font-bold">{threat.documentCount}</span> docs / {threat.timeWindowSeconds}s
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex px-3 py-1 text-[11px] font-bold rounded-lg bg-red-50 text-red-600 border border-red-100 shadow-sm">
                              {threat.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InsiderThreat;
