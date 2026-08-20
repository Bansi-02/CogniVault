import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NODE_URL } from '../../config/api';

const AdminBilling = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('cognivault_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [wsRes, metRes] = await Promise.all([
          axios.get(`${NODE_URL}/api/admin/workspaces`, { headers: { 'x-user-id': user.id } }),
          axios.get(`${NODE_URL}/api/admin/metrics`, { headers: { 'x-user-id': user.id } })
        ]);
        setWorkspaces(wsRes.data);
        setMetrics(metRes.data);
      } catch (err) {
        console.error('Failed to fetch billing workspaces', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Calculate stats from actual data
  const paidWorkspaces = workspaces.filter(w => w.subscription_tier && w.subscription_tier !== 'free_trial');
  const activeSubs = paidWorkspaces.length;
  
  let mrr = 0;
  paidWorkspaces.forEach(w => {
    const tier = (w.subscription_tier || '').toLowerCase();
    const cycle = (w.billing_cycle || 'monthly').toLowerCase();
    let baseMonthly = tier === 'basic' ? 7999 : tier === 'moderate' ? 24999 : tier === 'advanced' ? 39999 : 0;
    let contractPrice = baseMonthly;

    if (cycle === 'yearly') {
      contractPrice = Math.round(baseMonthly * 12 * 0.90);
    } else if (cycle.includes('half')) {
      contractPrice = Math.round(baseMonthly * 6 * 0.95);
    }

    mrr += contractPrice;
  });

  // Use synchronized MRR including paid ad partnerships (₹12,000)
  const displayMrr = metrics?.mrrINR !== undefined ? metrics.mrrINR : mrr;

  const transactions = paidWorkspaces.map(w => {
    const tier = (w.subscription_tier || '').toLowerCase();
    const cycle = (w.billing_cycle || 'monthly').toLowerCase();
    let base = tier === 'basic' ? 7999 : tier === 'moderate' ? 24999 : tier === 'advanced' ? 39999 : 0;
    
    let totalBilled = base;
    let cycleLabel = 'Monthly';
    if (cycle === 'yearly') {
      totalBilled = Math.round(base * 12 * 0.90);
      cycleLabel = 'Annual (10% off)';
    } else if (cycle.includes('half')) {
      totalBilled = Math.round(base * 6 * 0.95);
      cycleLabel = '6 Months (5% off)';
    }

    const d = new Date(w.createdAt || Date.now());
    const formattedDate = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

    return {
      id: `txn_${w._id.substring(0, 8)}`,
      company: w.name,
      amount: `₹${totalBilled.toLocaleString('en-IN')}`,
      plan: `${w.subscription_tier.charAt(0).toUpperCase() + w.subscription_tier.slice(1)} (${cycleLabel})`,
      date: formattedDate,
      status: 'Success'
    };
  }).sort((a, b) => {
    const [aD, aM, aY] = a.date.split('-');
    const [bD, bM, bY] = b.date.split('-');
    return new Date(`${bY}-${bM}-${bD}`) - new Date(`${aY}-${aM}-${aD}`);
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Billing & Tiers</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Manage revenue, enterprise subscriptions, and transactions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all">
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total MRR</h3>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">Live Data</span>
          </div>
          <div className="text-4xl font-black text-white">₹{displayMrr.toLocaleString()}</div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Subs</h3>
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full">Live Data</span>
          </div>
          <div className="text-4xl font-black text-white">{activeSubs}</div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col mb-10">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-black/40 text-gray-500 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-bold">Transaction ID</th>
                <th className="px-6 py-4 font-bold">Client / Company</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Plan</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10">Loading real data...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10">No active paid subscriptions found.</td></tr>
              ) : transactions.map((txn, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{txn.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-200">{txn.company}</td>
                  <td className="px-6 py-4 text-white font-medium">{txn.amount}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold tracking-wider">{txn.plan}</span>
                  </td>
                  <td className="px-6 py-4">{txn.date}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${txn.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {txn.status}
                    </span>
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

export default AdminBilling;
