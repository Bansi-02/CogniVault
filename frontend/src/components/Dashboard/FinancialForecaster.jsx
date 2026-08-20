import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

/* ── SVG Line Chart ── */
const ForecastChart = ({ historical, predicted, currencySymbol = "$" }) => {
  const svgRef = useRef(null);
  const W = 900, H = 340;
  const PAD = { top: 30, right: 30, bottom: 50, left: 70 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Combine all data, show last 6 historical + first 24 predicted for readability
  const histSlice = historical.slice(-6);
  const predSlice = predicted.slice(0, 24);
  const allData = [...histSlice, ...predSlice];

  const minVal = Math.min(...allData.map(d => d.value)) * 0.92;
  const maxVal = Math.max(...allData.map(d => d.value)) * 1.05;

  const xScale = (i) => PAD.left + (i / (allData.length - 1)) * chartW;
  const yScale = (v) => PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const histPoints = histSlice.map((d, i) => ({ x: xScale(i), y: yScale(d.value), ...d }));
  const predPoints = predSlice.map((d, i) => ({ x: xScale(histSlice.length - 1 + i), y: yScale(d.value), ...d }));

  // Build SVG path strings
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const histPath = toPath(histPoints);
  const predPath = toPath([histPoints[histPoints.length - 1], ...predPoints]);

  // Area fill under predicted
  const areaPath = `${predPath} L ${predPoints[predPoints.length-1].x} ${PAD.top + chartH} L ${histPoints[histPoints.length-1].x} ${PAD.top + chartH} Z`;

  // Y-axis labels
  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (i / yTicks) * (maxVal - minVal));

  // X-axis: show every 4th label
  const xLabels = allData.filter((_, i) => i % 4 === 0 || i === allData.length - 1);

  const formatVal = (v) => v >= 1000 ? `${currencySymbol}${(v/1000).toFixed(0)}k` : `${currencySymbol}${v}`;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ maxHeight: 340 }}>
      <defs>
        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yTickVals.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={yScale(v)} x2={PAD.left + chartW} y2={yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={PAD.left - 10} y={yScale(v) + 4} textAnchor="end" className="text-xs" fill="#94a3b8" fontSize="11">
            {formatVal(v)}
          </text>
        </g>
      ))}

      {/* Today divider */}
      <line
        x1={histPoints[histPoints.length-1].x}
        y1={PAD.top}
        x2={histPoints[histPoints.length-1].x}
        y2={PAD.top + chartH}
        stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"
      />
      <text
        x={histPoints[histPoints.length-1].x + 6}
        y={PAD.top + 14}
        fill="#6366f1" fontSize="10" fontWeight="bold"
      >TODAY</text>

      {/* Area fill under prediction */}
      <path d={areaPath} fill="url(#predGrad)" />

      {/* Historical line */}
      <path d={histPath} fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Prediction line — glowing indigo dashed */}
      <path
        d={`M ${histPoints[histPoints.length-1].x.toFixed(1)} ${histPoints[histPoints.length-1].y.toFixed(1)} ${predPoints.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}`}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 3"
        filter="url(#glow)"
      />

      {/* Historical dots */}
      {histPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#64748b" />
      ))}

      {/* Prediction dots (smaller) */}
      {predPoints.filter((_, i) => i % 3 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#6366f1" opacity="0.8" />
      ))}

      {/* X-axis labels */}
      {allData.map((d, i) => {
        if (i % 4 !== 0 && i !== allData.length - 1) return null;
        const isPred = i >= histSlice.length;
        return (
          <text key={i} x={xScale(i)} y={PAD.top + chartH + 22} textAnchor="middle" fontSize="10" fill={isPred ? '#6366f1' : '#94a3b8'} fontWeight={isPred ? 'bold' : 'normal'}>
            {d.month}
          </text>
        );
      })}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
};

/* ── Metric Card ── */
const MetricCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1 font-medium">{sub}</p>}
    </div>
  </div>
);

/* ══════════════════════════════════════════════ */
const FinancialForecaster = () => {
  const [mode, setMode] = useState('public'); // 'public' or 'private'
  const [ticker, setTicker] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Fetch documents on mount — public market data loads only when user searches
  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
      const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
      setDocuments(res.data);
    } catch (err) { console.error(`Error fetching docs:`, err); }
  };

  const handleSearch = async (searchTicker) => {
    const t = searchTicker || ticker;
    if (!t) return;
    
    setLoading(true);
    setForecastData(null);
    setError(``);
    try {
      const res = await axios.get(`${PYTHON_URL}/api/forecaster/predict?ticker=${t}`);
      setForecastData({
        ...res.data,
        currencySymbol: res.data.currency || '$'
      });
    } catch (err) { 
      console.error(err); 
      setError(err.response?.data?.detail || 'Failed to fetch financial data. Check the Python server.');
    }
    finally { setLoading(false); }
  };

  const handleSelectPrivateDoc = async (docId, filename) => {
    setSelectedDocId(docId);
    setLoading(true);
    setForecastData(null);
    setError('');
    try {
      // Call the Python server, passing the filename
      const res = await axios.get(`${PYTHON_URL}/api/forecaster/predict-private?filename=${filename}`);
      setForecastData({
        ...res.data,
        currencySymbol: res.data.currency || '$'
      });
    } catch (err) { 
      console.error(err); 
      setError(err.response?.data?.detail || 'Failed to extract financial data from document. Check Python logs.');
    }
    finally { setLoading(false); }
  };

  const fmt = (n) => {
    const symbol = forecastData?.currencySymbol || '$';
    return symbol + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  };

  
  const getFileIcon = (name) => {
    if (name?.toLowerCase().endsWith('.pdf')) return '📄';
    if (name?.toLowerCase().endsWith('.csv')) return '📊';
    if (name?.toLowerCase().endsWith('.txt')) return '📝';
    return '📁';
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight whitespace-nowrap">Financial Forecaster</h1>
          </div>

          <div className="flex-1 flex justify-end gap-3 items-center">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setMode('public')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'public' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Public Market
              </button>
              <button 
                onClick={() => setMode('private')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'private' ? 'bg-indigo-600 shadow-sm text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Private Vault
              </button>
            </div>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full">

            {/* Left Panel: Document List (Only in Private Mode) */}
            {mode === 'private' && (
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Vault</p>
              <p className="text-sm text-gray-500 mt-1">Select a document</p>
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
                    onClick={() => handleSelectPrivateDoc(doc._id, doc.filename)}
                    
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

)}

            <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Search Bar (Only in Public Mode) */}
            {mode === 'public' && (
            <div className="bg-white border-b border-gray-200 p-6 flex flex-col items-center justify-center shrink-0">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Live Enterprise Forecasting</h2>
              <p className="text-sm text-gray-500 mb-6">Enter a public stock ticker (e.g. AAPL, MSFT, TSLA) to run a live ML regression on their financial data.</p>
              
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                className="flex items-center gap-3 w-full max-w-lg"
              >
                <input 
                  type="text" 
                  placeholder="Ticker Symbol (e.g., AAPL)" 
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                />
                <button 
                  type="submit" 
                  disabled={loading || !ticker}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Forecast
                </button>
              </form>
              {error && <p className="text-red-500 text-sm font-bold mt-4">{error}</p>}
            </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                  <svg className="w-10 h-10 animate-spin mb-4 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <p className="font-semibold text-lg">Running Scikit-Learn Regression Model...</p>
                  <p className="text-sm mt-2">{mode === 'public' ? 'Fetching live market data and computing time-series forecast' : 'Extracting financial parameters via NLP and running prediction...'}</p>
                </div>
              ) : !forecastData ? (
                <div className="flex items-center justify-center h-80 text-gray-400 font-semibold">
                  {mode === 'public' ? 'Search a ticker to run the forecast.' : 'Select a document to run the private contract forecast.'}
                </div>
              ) : (
                <>
                  {/* Metrics row */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <MetricCard
                      label="Current Price"
                      value={fmt(forecastData.historical[forecastData.historical.length - 1]?.value || 0)}
                      sub="Last closing price"
                      color="bg-indigo-50"
                      icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <MetricCard 
                      label="Average Monthly Growth" 
                      value={`${forecastData.currencySymbol}${((forecastData.predicted[23].value - forecastData.historical[forecastData.historical.length - 1].value) / 24).toFixed(0)}`}
                      sub="Projected trajectory"
                      color="bg-emerald-50 text-emerald-600"
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    />
                    <MetricCard 
                      label="Year 1 Projected Value" 
                      value={`${forecastData.currencySymbol}${(forecastData.predicted[11].value / 1000).toFixed(1)}k`}
                      sub="By end of Year 1"
                      color="bg-indigo-50 text-indigo-600"
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    />
                    <MetricCard 
                      label="Year 2 Projected Value" 
                      value={`${forecastData.currencySymbol}${(forecastData.predicted[23].value / 1000).toFixed(1)}k`}
                      sub="By end of Year 2"
                      color="bg-violet-50 text-violet-600"
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                  </div>

                  {/* Chart */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Cost Trajectory Forecast</h2>
                        <p className="text-sm text-gray-400 mt-1">Past 6 months · Next 24 months predicted by ML Regression</p>
                      </div>
                      <div className="flex items-center gap-5 text-xs font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <span className="w-6 h-0.5 bg-slate-400 rounded inline-block" />
                          Historical
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-6 h-0.5 bg-indigo-500 rounded inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#6366f1 0,#6366f1 4px,transparent 4px,transparent 7px)' }} />
                          AI Predicted
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-[340px]">
                      <ForecastChart historical={forecastData.historical} predicted={forecastData.predicted} currencySymbol={forecastData.currencySymbol} />
                    </div>
                  </div>

                  {/* AI Insight Box */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-indigo-900 mb-1">CogniVault AI Insight</p>
                      <p className="text-sm text-indigo-700 leading-relaxed">
                        {mode === 'public' ? (
                          <>Our ML Regression model has analyzed {forecastData.ticker}'s historical price action. The forecast predicts a <strong>{(((forecastData.predicted[forecastData.predicted.length - 1]?.value || 1) / (forecastData.historical[forecastData.historical.length - 1]?.value || 1) - 1) * 100).toFixed(1)}%</strong> change over the next 24 months, bringing the valuation to <strong>{fmt(forecastData.predicted[forecastData.predicted.length - 1]?.value || 0)}</strong>. This regression factors in historical standard deviation to simulate market volatility.</>
                        ) : (
                          <>{forecastData.message}</>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialForecaster;
