import { NODE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminOverview = () => {
  const [metrics, setMetrics] = useState({ totalWorkspaces: 0, totalUsers: 0, freeTrialUsers: 0, mrrINR: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('cognivault_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${NODE_URL}/api/admin/metrics`, {
          headers: { 'x-user-id': user?.id || user?._id }
        });
        setMetrics(res.data);
      } catch (err) {
        console.error('Error fetching admin metrics', err);
      }
    };
    fetchMetrics();
  }, [navigate]);

  const kpis = [
    { label: 'Monthly Recurring Revenue', value: `₹${(metrics.mrrINR || 0).toLocaleString('en-IN')}`, trend: 'Live', color: 'emerald', chart: [30, 40, 45, 60, 70, 85, 100] },
    { label: 'Active Workspaces', value: (metrics.totalWorkspaces || 0).toString(), trend: 'Live', color: 'indigo', chart: [100, 105, 110, 115, 125, 135, 142] },
    { label: 'Total Users', value: (metrics.totalUsers || 0).toString(), trend: 'Live', color: 'violet', chart: [30, 32, 35, 34, 38, 40, 42] },
    { label: 'Free Trial Users', value: (metrics.freeTrialUsers || 0).toString(), trend: 'Live', color: 'blue', chart: [10, 15, 20, 25, 30, 35, 40] },
  ];

  const handleDownloadReport = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Monthly Recurring Revenue (INR)', metrics.mrrINR || 0],
      ['Active Workspaces', metrics.totalWorkspaces || 0],
      ['Total Users', metrics.totalUsers || 0],
      ['Free Trial Users', metrics.freeTrialUsers || 0],
      ['Report Generated At', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CogniVault_CommandCenter_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 h-full flex flex-col">
      {/* Page Header */}
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Platform metrics, revenue growth, and infrastructure health.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadReport} className="px-5 py-2 bg-white text-black text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all">Download Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#0B0F19]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500 shadow-xl">
            <div className={`absolute -right-20 -top-20 w-48 h-48 bg-${kpi.color}-500/20 rounded-full blur-[50px] group-hover:bg-${kpi.color}-500/30 transition-all duration-700 group-hover:scale-150`} />
            <p className="text-sm font-bold text-gray-400 relative z-10">{kpi.label}</p>
            <h2 className="text-3xl font-black text-white mt-2 tracking-tight relative z-10">{kpi.value}</h2>
            <div className="flex items-center justify-between mt-6 relative z-10">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg bg-${kpi.color}-500/10 text-${kpi.color}-400 border border-${kpi.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>{kpi.trend}</span>
              <div className="flex items-end gap-1 h-6">
                {kpi.chart.map((val, idx) => (
                  <div key={idx} className={`w-1 bg-${kpi.color}-500/50 rounded-full`} style={{ height: `${val}%` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex">
        {/* Main Revenue Chart */}
        <div className="w-full bg-[#0B0F19]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Revenue Growth</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Monthly recurring revenue (MRR) across all tiers.</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-end gap-3 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => (<div key={i} className="w-full h-[1px] bg-white/[0.03]" />))}
            </div>
            {[35, 45, 40, 60, 55, 75, 90, 85, 100].map((h, i) => {
              const monthRev = Math.round((metrics.mrrINR || 0) * (h / 100));
              return (
                <div key={i} className="flex-1 flex flex-col justify-end group/bar relative h-full">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold py-1 px-2 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none z-10">
                    ₹{monthRev.toLocaleString('en-IN')}
                  </div>
                  <div style={{ height: `${h}%` }} className="w-full bg-white/5 rounded-t-lg relative overflow-hidden transition-all duration-500 group-hover/bar:bg-white/10 group-hover/bar:shadow-[0_0_20px_rgba(255,255,255,0.1)] border-t border-white/10">
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-indigo-500/20 to-violet-500/50 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest shrink-0">
            <span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
