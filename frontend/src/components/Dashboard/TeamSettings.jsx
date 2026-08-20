import { NODE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';

const TeamSettings = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [members, setMembers] = useState([]);
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${NODE_URL}/api/workspace/members/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRemove = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member? This action cannot be undone and their seat will be freed up.")) return;
    try {
      const res = await fetch(`${NODE_URL}/api/workspace/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id })
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.message || 'Error removing member');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${NODE_URL}/api/workspace/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setMsg({ type: 'success', text: 'Invite sent successfully!' });
      setEmail('');
      fetchMembers(); // refresh
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Team Settings</h2>
        <p className="text-sm text-gray-400 mb-6">Manage your workspace members and invites.</p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Subscription Tier</span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
              {user.tier || 'Free Trial'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Seats Used</span>
            <span className="text-sm font-medium text-white">{members.length}</span>
          </div>
        </div>

        {user.role === 'manager' ? (
          <form onSubmit={handleInvite} className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">Invite New Member</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Invite'}
              </button>
            </div>
            {msg.text && (
              <p className={`text-xs mt-2 ${msg.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {msg.text}
              </p>
            )}
          </form>
        ) : (
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-gray-400">Only the Workspace Manager can invite new members.</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Active Members</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {members.map(m => (
              <div key={m._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <p className="text-sm text-white font-medium">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${m.role === 'manager' || m.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {m.role}
                  </span>
                  {user.role === 'manager' && m._id !== user.id && (
                    <button
                      onClick={() => handleRemove(m._id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      title="Remove Member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeamSettings;
