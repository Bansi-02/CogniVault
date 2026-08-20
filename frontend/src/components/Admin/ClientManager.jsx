import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClientManager = () => {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('cognivault_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const res = await axios.get(`${NODE_URL}/api/admin/workspaces`, {
          headers: { 'x-user-id': user.id }
        });
        // Map backend format to UI format with real trial and subscription expiration status
        const mapped = res.data.map(ws => {
          let status = 'Active';
          const now = Date.now();
          const created = new Date(ws.createdAt || Date.now()).getTime();

          if (ws.subscription_tier === 'free_trial') {
            const timeElapsed = now - created;
            status = timeElapsed >= 180000 ? 'Trial Expired' : 'Trial Active';
          } else {
            // Check paid subscription duration expiration
            let expiryTime = ws.subscriptionEndDate ? new Date(ws.subscriptionEndDate).getTime() : null;
            if (!expiryTime) {
              const cycle = (ws.billing_cycle || 'monthly').toLowerCase();
              const durationMonths = cycle === 'yearly' ? 12 : cycle === 'halfyearly' ? 6 : 1;
              const expDate = new Date(ws.createdAt || Date.now());
              expDate.setMonth(expDate.getMonth() + durationMonths);
              expiryTime = expDate.getTime();
            }

            if (now > expiryTime) {
              status = 'Subscription Expired';
            }
          }

          return {
            id: ws._id,
            name: ws.name,
            users: ws.members ? ws.members.length : 1,
            tier: ws.subscription_tier,
            duration: ws.billing_cycle || 'monthly',
            storage: 'N/A',
            status: status,
            ownerEmail: ws.owner?.email || 'No email provided',
            createdAt: ws.createdAt
          };
        });
        setClients(mapped);
      } catch (err) {
        console.error('Error fetching workspaces', err);
      }
    };
    fetchWorkspaces();
  }, [navigate]);

  const handleSendReminder = async (workspaceId, clientName) => {
    try {
      const res = await axios.post(`${NODE_URL}/api/admin/send-expiry-reminder/${workspaceId}`, {}, {
        headers: { 'x-user-id': user.id }
      });
      alert(res.data.message || `Renewal reminder email sent for ${clientName}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending reminder email.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this workspace?')) return;
    
    try {
      const userStr = sessionStorage.getItem('cognivault_user');
      const user = JSON.parse(userStr);
      await axios.delete(`${NODE_URL}/api/admin/workspace/${id}`, {
        headers: { 'x-user-id': user.id }
      });
      setClients(clients.filter(w => w.id !== id));
    } catch (err) {
      alert('Error deleting workspace');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 h-full flex flex-col">
      
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Client Manager</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Manage workspaces, subscription tiers, and access limits.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors w-64"
            />
          </div>
          <button className="px-5 py-2 bg-white text-black text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all flex items-center gap-2">
            <span>+</span> New Workspace
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#0B0F19]/80 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#030712]/50 text-[10px] uppercase tracking-widest font-bold text-gray-500 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 font-bold">Client / Workspace</th>
                <th className="px-8 py-5 font-bold">Subscription Tier</th>
                <th className="px-8 py-5 font-bold min-w-[160px] whitespace-nowrap">Joined</th>
                <th className="px-8 py-5 font-bold">Active Seats</th>
                <th className="px-8 py-5 font-bold">Account Status</th>
                <th className="px-8 py-5 font-bold text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{c.name}</div>
                        <div className="text-[11px] font-mono text-gray-500 mt-0.5">{c.ownerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-gray-300 font-semibold text-xs tracking-wide capitalize">{c.tier.replace('_', ' ')}</span>
                  </td>
                  <td className="px-8 py-5 min-w-[160px] whitespace-nowrap">
                    <span className="text-gray-400 font-medium text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-gray-300 font-mono text-sm">{c.users}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold border flex items-center gap-2 w-fit ${
                      c.status === 'Active' || c.status === 'Trial Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' :
                      c.status === 'Past Due' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        c.status === 'Active' || c.status === 'Trial Active' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]' :
                        c.status === 'Past Due' ? 'bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.8)] animate-pulse' :
                        'bg-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.8)]'
                      }`} />
                      {c.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSendReminder(c.id, c.name)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-wider transition-colors p-2 hover:bg-indigo-500/10 rounded-xl flex items-center gap-1.5"
                      title="Send Subscription Renewal Email Reminder"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Remind
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-colors p-2 hover:bg-red-500/10 rounded-xl" title="Suspend Workspace">
                      SUSPEND
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ClientManager;
