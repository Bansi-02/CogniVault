import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const ComplianceOracle = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('oracle_history');
    if (saved) return JSON.parse(saved);
    return [
      {
        sender: 'oracle',
        text: "Hello. I am the Compliance Oracle. I can advise you on key corporate compliance frameworks like GDPR, HIPAA, SOC 2, and CCPA, as well as data deletion or breach notification rules. Ask me a question below.",
        confidence: 100,
        topicInsight: null
      }
    ];
  });

  useEffect(() => {
    sessionStorage.setItem('oracle_history', JSON.stringify(messages));
  }, [messages]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInsight, setSelectedInsight] = useState(null);

  const quickChips = [
    "GDPR Article 17 Data Erasure",
    "SOC 2 Trust Services Criteria",
    "HIPAA Breach Notification 500+",
    "CCPA Do Not Sell My Info",
    "Data Breach 72-Hour rule"
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    setQuery('');
    setLoading(true);
    setError('');

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
      const res = await axios.post(`${PYTHON_URL}/api/oracle/query`, {
        query: text,
        countryCode: user.countryCode || null
      });

      const oracleMsg = {
        sender: 'oracle',
        text: res.data.response,
        confidence: res.data.confidence,
        topicInsight: res.data.topic_insight
      };

      setMessages((prev) => [...prev, oracleMsg]);
      // Deep Insight modal only opens when user clicks "View Deep Insight" — NOT automatically.
    } catch (err) {
      setError(err.response?.data?.detail || "Could not connect to the Compliance Oracle backend. Is the Python server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip) => {
    handleSend(chip);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      <Sidebar currentTier={3} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Compliance Oracle</h1>
          </div>
        </header>

        {/* Layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: Chat Interface */}
          <div className="flex-1 flex flex-col h-full bg-gray-50/40 relative">

            {/* Quick Chips */}
            <div className="p-4 border-b border-gray-200/60 flex gap-2 overflow-x-auto shrink-0 bg-gray-50/20">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-slate-700/80 text-gray-600 hover:text-gray-900 text-xs font-bold rounded-full border border-gray-200 transition-all whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="m-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <p className="text-xs font-bold text-red-400">{error}</p>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-2xl rounded-2xl p-5 border ${msg.sender === 'user' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>

                    {/* Oracle metadata */}
                    {msg.sender === 'oracle' && (
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/80">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">Oracle Advisory</span>
                          {msg.confidence !== undefined && (
                            <span className="px-1.5 py-0.5 bg-fuchsia-500/15 border border-fuchsia-500/30 rounded text-[9px] font-extrabold text-fuchsia-400">
                              Match: {msg.confidence}%
                            </span>
                          )}
                        </div>
                        {msg.topicInsight && (
                          <button
                            onClick={() => setSelectedInsight(msg.topicInsight)}
                            className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 underline transition-colors"
                          >
                            View Deep Insight
                          </button>
                        )}
                      </div>
                    )}

                    {/* Message body */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-fuchsia-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span className="text-xs font-bold text-gray-500">Consulting regulatory database...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200/80 bg-gray-50/80 backdrop-blur shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-3 max-w-4xl mx-auto"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a compliance question (e.g. 'How does GDPR affect data deletion?' or 'What is the HIPAA breach rule?')"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all placeholder-slate-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl px-6 flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/20 transition-all text-sm"
                >
                  Consult
                </button>
              </form>
            </div>

          </div>

          {/* Deep Insight Modal */}
          {selectedInsight && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 relative animate-slide-up border border-indigo-100">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Deep Insight</h3>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">{selectedInsight.topic}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {selectedInsight.gdpr && (
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest">EU GDPR Reference</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 group-hover:bg-blue-50 transition-colors">
                        {selectedInsight.gdpr}
                      </p>
                    </div>
                  )}

                  {selectedInsight.hipaa && (
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">US HIPAA Reference</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 group-hover:bg-emerald-50 transition-colors">
                        {selectedInsight.hipaa}
                      </p>
                    </div>
                  )}

                  {selectedInsight.ccpa && (
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-black text-amber-600 uppercase tracking-widest">US CCPA Reference</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 group-hover:bg-amber-50 transition-colors">
                        {selectedInsight.ccpa}
                      </p>
                    </div>
                  )}
                </div>

                {(selectedInsight.actionable_step || selectedInsight.recommendation) && (
                  <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/60 p-6 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Actionable Step
                    </h4>
                    <p className="text-sm font-semibold text-indigo-900/80 leading-relaxed relative z-10">
                      {selectedInsight.actionable_step || selectedInsight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ComplianceOracle;
