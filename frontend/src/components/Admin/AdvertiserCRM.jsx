import { NODE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdvertiserCRM = () => {
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('cognivault_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }
    fetchPartnerships();
  }, [navigate]);

  const fetchPartnerships = async () => {
    const user = JSON.parse(sessionStorage.getItem('cognivault_user'));
    try {
      const res = await axios.get(`${NODE_URL}/api/admin/partnerships`, {
        headers: { 'x-user-id': user.id }
      });
      setAdvertisers(res.data);
    } catch (err) {
      console.error('Error fetching partnerships', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status, rejectionReason = '') => {
    if (!selectedAd) return;
    setActionLoading(true);
    const user = JSON.parse(sessionStorage.getItem('cognivault_user'));
    try {
      await axios.patch(`${NODE_URL}/api/admin/partnership/${selectedAd._id}`, { status, rejectionReason }, {
        headers: { 'x-user-id': user.id }
      });
      setSelectedAd(null);
      fetchPartnerships();
    } catch (err) {
      console.error(err);
      alert('Failed to update partnership status.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'approved_awaiting_payment': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'expired': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 h-full flex flex-col relative">
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Advertiser CRM</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Manage incoming partnership requests, regional billing, and scheduling.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#0B0F19]/80 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white font-bold">Loading requests...</div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#030712]/50 text-[10px] uppercase tracking-widest font-bold text-gray-500 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-8 py-5 font-bold">Company / Region</th>
                  <th className="px-8 py-5 font-bold">Dates / Placement</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                  <th className="px-8 py-5 font-bold">Payment</th>
                  <th className="px-8 py-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {advertisers.map((adv) => (
                  <tr key={adv._id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedAd(adv)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                          {adv.company.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{adv.company}</div>
                          <div className="text-[11px] font-mono text-gray-500 mt-0.5">{adv.email} | {adv.region?.toUpperCase() || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-gray-300 font-semibold text-xs tracking-wide">
                        {adv.startDate ? `${new Date(adv.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} - ${new Date(adv.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}` : 'Unscheduled'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold border flex items-center gap-2 w-fit ${getStatusBadge(adv.status)}`}>
                        {adv.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-xs font-bold uppercase tracking-wider ${adv.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {adv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-wider transition-colors p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl" onClick={(e) => { e.stopPropagation(); setSelectedAd(adv); }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {advertisers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-10 text-center text-gray-500 font-medium">
                      No advertiser requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAd(null)}>
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-white mb-2">Review Application</h3>
            <p className="text-gray-400 text-sm mb-6">Review the banner and pricing for {selectedAd.company}.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-gray-400 text-sm font-bold">Region / Pricing:</span>
                <span className="text-white text-sm font-black">{selectedAd.region === 'india' ? '₹6,000 INR' : '$120 USD'}</span>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="block text-gray-400 text-sm font-bold mb-3">Banner Asset:</span>
                <div className="bg-black/50 rounded-lg p-4 flex items-center justify-center min-h-[100px]">
                  <img src={`${NODE_URL}/${selectedAd.bannerPath}`} alt="Banner" className="max-h-[150px] object-contain" />
                </div>
              </div>
            </div>

            {selectedAd.status === 'pending' ? (
              <div className="flex gap-4 mt-8">
                <button onClick={() => handleAction('rejected')} disabled={actionLoading} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">
                  Reject
                </button>
                <button onClick={() => handleAction('approved_awaiting_payment')} disabled={actionLoading} className="flex-1 py-3 px-4 rounded-xl font-black text-sm bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
                  Approve & Send Bill
                </button>
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-white/10 text-center flex flex-col items-center gap-4">
                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                  Current Status: <span className={getStatusBadge(selectedAd.status).split(' ')[1]}>{selectedAd.status.replace(/_/g, ' ')}</span>
                </span>

                {selectedAd.status === 'approved_awaiting_payment' && (
                  <div className="w-full space-y-3">
                    <p className="text-gray-500 text-xs font-medium">
                      💡 Payment link was sent to <span className="text-indigo-400 font-bold">{selectedAd.email}</span>. Use the button below to manually confirm payment for local testing.
                    </p>
                    <button
                      onClick={() => handleAction('mark_paid')}
                      disabled={actionLoading}
                      className="w-full py-3 px-4 rounded-xl font-black text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full inline-block" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as Paid & Schedule Ad
                        </>
                      )}
                    </button>
                  </div>
                )}

                {selectedAd.status === 'scheduled' && (
                  <button
                    onClick={() => handleAction('stopped')}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                  >
                    Stop Promotion
                  </button>
                )}
              </div>
            )}
            
            <button onClick={() => setSelectedAd(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserCRM;
