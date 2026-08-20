import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

/* ── Threat Gauge ─────────────────────────────────────────────────── */
const ThreatGauge = ({ score }) => {
  const r = 73, stroke = 14, circ = 2 * Math.PI * r;
  const offset = ((100 - score) / 100) * circ;
  // Note: For threat, HIGHER is WORSE.
  // <30 Safe, 30-69 Suspicious, 70+ High Risk
  const color = score >= 70 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#10b981';
  const label = score >= 70 ? 'High Risk' : score >= 30 ? 'Suspicious' : 'Safe';
  const bg = score >= 70 ? ['#fee2e2','#991b1b'] : score >= 30 ? ['#fef3c7','#92400e'] : ['#d1fae5','#065f46'];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>{score}</span>
          <span className="text-xs font-bold text-gray-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <div className="mt-3 px-4 py-1.5 rounded-full text-xs font-extrabold" style={{ backgroundColor: bg[0], color: bg[1] }}>{label}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
const CommunicationShield = () => {
  // Form state
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Result state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!sender.trim() || !body.trim()) {
      setError("Sender and Body are required.");
      return;
    }
    setLoading(true); setResult(null); setError('');
    try {
      const res = await axios.post(`${PYTHON_URL}/api/shield/analyze`, {
        sender,
        subject,
        body
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not connect to the Shield Engine. Is the Python server running?');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyle = (verdict) => {
    if (verdict === 'High Risk') return 'bg-red-50 border-red-200 text-red-800';
    if (verdict === 'Suspicious') return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  };

  const getFlagStyle = (category) => {
    if (category === 'phishing') return 'bg-red-100 text-red-800 border-red-200';
    if (category === 'financial') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (category === 'urgency') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800';
  };

  const loadDemoEmail = () => {
    setSender("billing-update@paypal-support-team.com");
    setSubject("URGENT: Your account will be suspended");
    setBody("Dear customer,\n\nWe noticed unusual activity. Your account will be suspended within 24 hours.\n\nKindly click here to login immediately and update your routing number and bank details for wire transfer.\n\nImmediate action required.\n\nRegards,\nSupport");
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      <Sidebar currentTier={2} />
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Privilege Sentinel</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Input Form */}
          <div className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email Scanner
            </h2>
            <form onSubmit={handleAnalyze} className="flex-1 flex flex-col gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sender Email</label>
                <input
                  type="text"
                  value={sender}
                  onChange={e => setSender(e.target.value)}
                  placeholder="e.g. vendor@company.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Invoice #4029"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Body</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Paste the email content here..."
                  className="w-full flex-1 min-h-[250px] px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all resize-none"
                  required
                />
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all">
                {loading
                  ? <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Analyzing Threats...</>
                  : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>Run Security Scan</>
                }
              </button>
            </form>
          </div>

          {/* Right Column: Analysis Results */}
          <div className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Threat Analysis
            </h2>

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!result && !loading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50/30">
                <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="font-bold text-gray-600 text-lg mb-2">No Communication Scanned</p>
                <p className="text-sm max-w-sm">Paste an email on the left and run the scan to detect phishing attempts, urgency manipulation, and financial risk.</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50/30">
                <svg className="w-10 h-10 animate-spin mb-4 text-purple-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="font-bold text-lg text-gray-600">Analyzing Communication...</p>
                <p className="text-sm mt-1 text-gray-400">Scanning for heuristics & urgency patterns</p>
              </div>
            )}

            {/* Results State */}
            {result && !loading && (
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
                
                {/* Verdict Banner */}
                <div className={`px-5 py-4 rounded-2xl border font-bold text-sm flex items-center justify-between ${getVerdictStyle(result.verdict)}`}>
                  <div className="flex items-center gap-3">
                    {result.verdict === 'Safe' ? '✅' : result.verdict === 'Suspicious' ? '⚡' : '⚠️'}
                    <span>Verdict: {result.verdict}</span>
                  </div>
                  <div className="text-xs opacity-80 uppercase tracking-wider font-extrabold bg-white/50 px-3 py-1 rounded-full">
                    {result.recommended_action}
                  </div>
                </div>

                {/* Score Panel */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                  <ThreatGauge score={result.threat_score} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-3">Threat Score</p>
                </div>

                {/* Flags Breakdown */}
                {result.flags && result.flags.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="text-sm font-extrabold text-gray-900">Detected Threats ({result.flags.length})</h3>
                    </div>
                    <div className="p-5 space-y-4 overflow-y-auto">
                      {result.flags.map((flag, i) => (
                        <div key={i} className="flex flex-col gap-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex items-start gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded border ${getFlagStyle(flag.category)}`}>
                              {flag.category}
                            </span>
                            <span className="text-sm font-bold text-gray-800">{flag.reason}</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-600 font-mono leading-relaxed break-words">
                            {/* Simple bolding of the flagged text within the context snippet */}
                            {flag.context.split(new RegExp(`(${flag.text})`, 'i')).map((part, index) => 
                              part.toLowerCase() === flag.text.toLowerCase() ? 
                                <strong key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">{part}</strong> : 
                                <span key={index}>{part}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800 flex-1 flex flex-col justify-center items-center">
                     <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                     <p className="font-bold">No Threats Detected</p>
                     <p className="text-sm mt-1 opacity-80">This communication does not contain known phishing or urgency patterns.</p>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationShield;
