import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminEnterprise = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${PYTHON_URL}/api/enterprise`);
      setTickets(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load enterprise proposals');
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setReplying(true);
    try {
      await axios.post(`${PYTHON_URL}/api/enterprise/${selectedTicket._id}/reply`, {
        replyMessage: replyText
      });
      setReplyText('');
      setSelectedTicket(null);
      fetchTickets(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert('Failed to send reply. Check console.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Enterprise Proposals</h1>
            <p className="text-gray-400">Manage custom enterprise deployment proposals.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Ticket List */}
          <div className="lg:col-span-1 bg-[#0b101d] border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 border-b border-gray-800 bg-[#080c14]">
              <h2 className="font-bold text-white">Inbox ({tickets.filter(t => t.status === 'Open').length} Open)</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : tickets.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No proposals found.</div>
              ) : (
                tickets.map(ticket => (
                  <button
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 rounded-xl transition-colors ${selectedTicket?._id === ticket._id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-[#050914] border border-gray-800/50 hover:bg-gray-800/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-white truncate pr-2">{ticket.name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${ticket.status === 'Open' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-2">{ticket.email}</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{ticket.message}</p>
                    <div className="text-[10px] text-gray-500 mt-3 text-right">
                      {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail / Reply View */}
          <div className="lg:col-span-2 bg-[#0b101d] border border-gray-800 rounded-2xl flex flex-col h-[700px]">
            {selectedTicket ? (
              <>
                <div className="p-6 border-b border-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedTicket.name}</h2>
                      <a href={`mailto:${selectedTicket.email}`} className="text-indigo-400 text-sm hover:underline">{selectedTicket.email}</a>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(selectedTicket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') + ' ' + new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="bg-[#050914] border border-gray-800 rounded-xl p-5 mt-4">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {selectedTicket.status === 'Closed' ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                      <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Replied on {new Date(selectedTicket.repliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') + ' ' + new Date(selectedTicket.repliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </h3>
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="flex flex-col h-full">
                      <label className="block font-bold text-white mb-2">Compose Enterprise Response</label>
                      <textarea
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 w-full bg-[#050914] border border-gray-700/50 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none mb-4"
                        placeholder="Type your response here. This will be emailed directly to the enterprise prospect..."
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replying}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2"
                        >
                          {replying ? 'Sending...' : (
                            <>
                              Send Reply
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                <p>Select a proposal from the inbox to view details</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default AdminEnterprise;
