import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const ExecutiveSummary = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [progressText, setProgressText] = useState('');
  const [summary, setSummary] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
        if (!user.id) return navigate('/');
        const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
        setDocuments(res.data);
      } catch (err) {
        console.error('Error fetching documents', err);
      }
    };
    fetchDocuments();
  }, [navigate]);

  const generateSummary = () => {
    if (!selectedDocId) return;
    setStatus('loading');
    setSummary(null);
    setProgressText('Initializing LLM context window...');

    // Mock sequence
    setTimeout(() => setProgressText('Scanning document for key entities...'), 1500);
    setTimeout(() => setProgressText('Extracting financial obligations...'), 3000);
    setTimeout(() => setProgressText('Synthesizing executive brief...'), 4500);
    
    setTimeout(() => {
      setStatus('success');
      setSummary({
        parties: ['Acme Corporation (Client)', 'Globex Tech Solutions (Vendor)'],
        effectiveDate: 'October 1, 2026',
        termLength: '36 Months',
        financials: 'Total Contract Value: $1.2M. Paid in quarterly installments of $100,000.',
        keyObligations: [
          'Globex must maintain 99.99% uptime for cloud infrastructure.',
          'Acme must provide 30-day written notice for any change in scope.',
          'Penalty of $10,000 applies for every 24 hours of service downtime.'
        ],
        termination: 'Either party may terminate for convenience with 90 days prior written notice. Early termination by Acme incurs a 20% penalty of remaining contract value.'
      });
    }, 6000);
  };

  const handleSelectDoc = (id) => {
    setSelectedDocId(id);
    setStatus('idle');
    setSummary(null);
  };

  const getFileIcon = (name) => {
    if (name?.toLowerCase().endsWith('.pdf')) return '📄';
    if (name?.toLowerCase().endsWith('.csv')) return '📊';
    if (name?.toLowerCase().endsWith('.txt')) return '📝';
    return '📁';
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      <Sidebar currentTier={1} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Executive Summary</h1>
          </div>
        </header>
        {/* Body: Two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL: Document List */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Vault</p>
              <p className="text-sm text-gray-500 mt-1">Select a document to summarize</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {documents.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">No documents yet</p>
                  <Link to="/vault" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Upload to Intelligence Vault →</Link>
                </div>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc._id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      selectedDocId === doc._id
                        ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedDocId === doc._id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="text-lg">{getFileIcon(doc.originalName)}</span>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className={`text-sm font-bold truncate ${
                        selectedDocId === doc._id ? 'text-indigo-700' : 'text-gray-700'
                      }`}>{doc.originalName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Main Content */}
          <div className="flex-1 overflow-y-auto p-8 relative flex flex-col bg-white">
            {status === 'idle' && (
              <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Executive Summary</h2>
                <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                  Select a document from your vault on the left, then click Generate to let our AI instantly synthesize a comprehensive briefing.
                </p>
                <button 
                  onClick={generateSummary}
                  disabled={!selectedDocId}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                    selectedDocId 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Generate Summary
                </button>
              </div>
            )}

            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-[3px] border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-700">{progressText}</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">This usually takes about 10 seconds...</p>
              </div>
            )}

            {summary && (
              <div className="max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Executive Briefing</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Generated by CogniVault AI</p>
                  </div>
                  <button onClick={() => setStatus('idle')} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg">
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Parties</p>
                      <p className="text-sm font-bold text-gray-900">{summary.parties.join(' & ')}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Effective Term</p>
                      <p className="text-sm font-bold text-gray-900">{summary.effectiveDate} — {summary.termLength}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">Financial Summary</h3>
                  <p className="text-sm text-blue-900 font-semibold leading-relaxed">{summary.financials}</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Key Obligations</h3>
                  <ul className="space-y-3">
                    {summary.keyObligations.map((ob, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm text-gray-700 leading-relaxed font-medium">{ob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Termination Clause</h3>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{summary.termination}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
