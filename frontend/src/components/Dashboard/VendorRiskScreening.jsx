import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

/* ── Gauge ─────────────────────────────────────────────────── */
const TrustGauge = ({ score }) => {
  const r = 73, stroke = 14, circ = 2 * Math.PI * r;
  const offset = ((100 - score) / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Low Risk' : score >= 45 ? 'Medium Risk' : 'High Risk';
  const bg = score >= 70 ? ['#d1fae5','#065f46'] : score >= 45 ? ['#fef3c7','#92400e'] : ['#fee2e2','#991b1b'];
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

/* ── Signal Row ─────────────────────────────────────────────── */
const Signal = ({ type, source, text, date, url }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <span className={`mt-0.5 px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex-shrink-0 ${
      type === 'negative' ? 'bg-red-100 text-red-700' : type === 'neutral' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
    }`}>{type}</span>
    <div className="flex-1 min-w-0">
      {url ? <a href={url} target="_blank" rel="noreferrer" className="text-sm text-gray-800 leading-snug hover:text-indigo-600">{text}</a>
           : <p className="text-sm text-gray-800 leading-snug">{text}</p>}
      <p className="text-xs text-gray-400 mt-0.5">{source} · {date}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════ */
const VendorRiskScreening = () => {
  // Search state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null); // {name, domain, logo}
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const dropdownRef = useRef(null);

  // Result state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clearbit autocomplete — fires as user types
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    // If user already selected a company and didn't change query, skip
    if (selectedCompany && selectedCompany.name === query) return;

    const t = setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const res = await axios.get(`${PYTHON_URL}/api/vendor/suggest`, { params: { q: query } });
        setSuggestions(res.data || []);
        setShowDropdown(true);
      } catch { setSuggestions([]); }
      finally { setLoadingSuggest(false); }
    }, 300); // debounce 300ms
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Core search function — shared by dropdown click AND Search button
  const doSearch = async (company) => {
    const searchName = company?.name || query;
    if (!searchName.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const params = { name: searchName };
      if (company?.domain) params.domain = company.domain;
      const res = await axios.get(`${PYTHON_URL}/api/vendor/screen`, { params });
      setResult({ displayName: searchName, logo: company?.logo, ...res.data });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not connect to the screening engine. Is the Python server running?');
    } finally { setLoading(false); }
  };

  const selectCompany = (c) => {
    setSelectedCompany(c);
    setQuery(c.name);
    setShowDropdown(false);
    setSuggestions([]);
    doSearch(c);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    doSearch(selectedCompany);
  };

  const verdict = (score) => {
    if (score >= 70) return { label: '✅ Low Risk — No significant adverse media found. Generally safe to proceed.', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
    if (score >= 45) return { label: '⚡ Medium Risk — Mixed signals detected. Proceed with enhanced SLA terms.', cls: 'bg-amber-50 border-amber-200 text-amber-800' };
    return { label: '⚠️ High Risk — Significant negative media detected. Seek legal review before signing.', cls: 'bg-red-50 border-red-200 text-red-800' };
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans">
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight whitespace-nowrap">Vendor Risk Screen</h1>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="relative w-full max-w-md" ref={dropdownRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search any company (e.g., Apple, Stripe)..."
                  className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="absolute inset-y-1.5 right-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  Screen
                </button>
              </form>

              {/* Autocomplete Dropdown */}
              {showDropdown && (query.length >= 2) && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {loadingSuggest ? (
                    <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Searching companies...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="max-h-64 overflow-y-auto">
                      {suggestions.map((c, i) => (
                        <li 
                          key={i} 
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
                          onClick={() => selectCompany(c)}
                        >
                          {c.logo ? (
                            <img src={c.logo} alt="" className="w-8 h-8 rounded bg-gray-100 object-contain border border-gray-200" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.domain}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No exact matches found. Press Screen to search anyway.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 relative flex flex-col bg-white">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Multi-Source Vendor Intelligence</h2>
              <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                Type any company name above. Select the exact company from the dropdown to avoid name conflicts, then click Screen to run a live compliance check.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 rounded-full border-[3px] border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-700">Synthesizing live media & risk data...</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">Querying global compliance databases...</p>
            </div>
          )}

          {result && !loading && (
            <div className="max-w-6xl mx-auto w-full pb-10">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  {result.logo ? (
                    <img src={result.logo} alt="Logo" className="w-16 h-16 rounded-xl border border-gray-200 shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 font-bold text-2xl shadow-sm">
                      {result.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{result.displayName}</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Live Risk Assessment Report</p>
                  </div>
                </div>
                <button onClick={() => setResult(null)} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                  Reset Scan
                </button>
              </div>
              
              <div className={`p-4 rounded-xl border mb-8 font-medium text-sm flex items-start gap-3 ${verdict(result.score).cls}`}>
                <span className="text-lg mt-0.5">{verdict(result.score).label.split(' ')[0]}</span>
                <div>
                  <p className="font-bold mb-1">{verdict(result.score).label.split('—')[0].substring(2)}</p>
                  <p className="opacity-90 leading-relaxed">{verdict(result.score).label.split('—')[1]}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Gauge & Summary */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex justify-center">
                    <TrustGauge score={result.score} />
                  </div>
                  
                  {result.ddg && result.ddg.found && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Company Intelligence
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium line-clamp-6">{result.ddg.abstract}</p>
                      {result.ddg.official_site && (
                        <a href={result.ddg.official_site} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold mt-4 inline-block flex items-center gap-1">
                          Official Website <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Sentiment Breakdown</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(result.sentiment_breakdown.positive / result.article_count) * 100}%` }}></div>
                         </div>
                         <div className="w-16 text-right text-xs font-bold text-emerald-600">{result.sentiment_breakdown.positive} Positive</div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="bg-red-500 h-full" style={{ width: `${(result.sentiment_breakdown.negative / result.article_count) * 100}%` }}></div>
                         </div>
                         <div className="w-16 text-right text-xs font-bold text-red-600">{result.sentiment_breakdown.negative} Negative</div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="bg-gray-400 h-full" style={{ width: `${(result.sentiment_breakdown.neutral / result.article_count) * 100}%` }}></div>
                         </div>
                         <div className="w-16 text-right text-xs font-bold text-gray-500">{result.sentiment_breakdown.neutral} Neutral</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Signals */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[800px]">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" /></svg>
                        Media & Compliance Signals
                      </h3>
                      <span className="text-xs font-bold bg-white text-gray-500 px-3 py-1 rounded-full border border-gray-200">
                        {result.article_count} sources analyzed
                      </span>
                    </div>
                    <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                      {result.signals && result.signals.length > 0 ? (
                        <div className="px-4">
                          {result.signals.map((sig, idx) => (
                            <Signal key={idx} {...sig} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-gray-400">
                          <p className="font-medium">No distinct signals identified.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorRiskScreening;
