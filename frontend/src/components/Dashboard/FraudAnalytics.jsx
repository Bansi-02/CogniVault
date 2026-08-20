import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from './Sidebar';

/* ── Custom Interactive Leaflet Map ── */
const createCustomIcon = (risk, isHovered) => {
  const color = risk === 'High' ? 'rgb(244 63 94)' : 'rgb(245 158 11)'; // rose-500 or amber-500
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px; transform: translate(-12px, -12px);">
        <div style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid ${color}; opacity: ${isHovered ? '0.6' : '0.2'}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 6px; left: 6px; width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; opacity: ${isHovered ? '0.6' : '0.2'};"></div>
        <div style="position: absolute; top: 9px; left: 9px; width: 6px; height: 6px; border-radius: 50%; background-color: ${color}; transition: all 0.3s;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Map Controller for Fly-To animation
const MapController = ({ activeNode }) => {
  const map = useMap();
  useEffect(() => {
    if (activeNode && activeNode.lat && activeNode.lng) {
      map.flyTo([activeNode.lat, activeNode.lng], 4, { duration: 1.5, easeLinearity: 0.25 });
    } else {
      map.flyTo([20, 0], 2, { duration: 1.5 });
    }
  }, [activeNode, map]);
  return null;
};

const ThreatMap = ({ hotspots, activeNode, onHoverNode }) => {
  const [mapTheme, setMapTheme] = useState('dark');
  
  const mapTiles = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  const HQ_COORDS = [40.7128, -74.0060]; // New York HQ
  return (
    <div className="relative bg-gray-900 border border-gray-200 rounded-3xl overflow-hidden w-full h-[400px] shadow-2xl group">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-gray-900/90 to-transparent pointer-events-none">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              Live Global Threat Center
            </h3>
            <p className="text-xs text-gray-200 mt-0.5 drop-shadow-md">Real-time geolocation of detected fraudulent invoices</p>
          </div>
          
          <div className="flex flex-col gap-2 pointer-events-auto">
            {/* Theme Toggle */}
            <div className="flex bg-gray-900/60 backdrop-blur-md rounded-xl p-1 border border-gray-700/50 shadow-lg">
              {['dark', 'light', 'satellite'].map(theme => (
                <button
                  key={theme}
                  onClick={() => setMapTheme(theme)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${mapTheme === theme ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  {theme}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs font-semibold text-gray-300 bg-gray-900/60 px-3 py-1.5 rounded-xl border border-gray-700/50 backdrop-blur-md shadow-lg">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                High Threat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium Threat
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        minZoom={2}
        className="w-full h-full z-0"
        style={{ background: mapTheme === 'light' ? '#f8fafc' : '#0f172a' }}
        zoomControl={false}
      >
        <MapController activeNode={activeNode} />
        <TileLayer
          key={mapTheme}
          url={mapTiles[mapTheme]}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {/* HQ Marker */}
        <Marker position={HQ_COORDS} icon={L.divIcon({
          className: 'hq-icon',
          html: `<div style="width: 12px; height: 12px; background: #38bdf8; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #38bdf8;"></div>`
        })}>
          <Tooltip direction="bottom">Corporate HQ (New York)</Tooltip>
        </Marker>

        {hotspots.map((node) => {
          const position = [node.lat || 0, node.lng || 0];
          const isSelected = activeNode?.id === node.id;
          const isHighRisk = node.risk === 'High';
          
          return (
            <React.Fragment key={node.id}>
              {/* Flight Path / Threat Vector */}
              <Polyline 
                positions={[HQ_COORDS, position]}
                pathOptions={{ 
                  color: isHighRisk ? '#f43f5e' : '#f59e0b', 
                  weight: isSelected ? 3 : 1.5,
                  opacity: isSelected ? 0.8 : 0.3,
                  dashArray: '5, 10',
                  className: 'animate-[dash_2s_linear_infinite]'
                }}
              />

              <Marker 
                position={position}
                icon={createCustomIcon(node.risk, isSelected)}
                eventHandlers={{
                  click: () => onHoverNode(node),
                }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Tooltip 
                  direction="top" 
                  offset={[0, -10]} 
                  opacity={1}
                  className="custom-leaflet-tooltip"
                  permanent={isSelected}
                >
                  <div className="bg-gray-900/80 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-gray-700/50 max-w-[220px]">
                    <p className="font-bold text-sm mb-1">{node.vendor}</p>
                    <p className={`text-xs font-extrabold ${isHighRisk ? 'text-rose-400' : 'text-amber-400'}`}>
                      {node.risk} Risk · {node.type}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-1">{node.location}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-2 border-t border-gray-700/50 pt-2">{node.action}</p>
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Custom Global CSS for Leaflet Tooltip to remove default white box */}
      <style>{`
        .custom-leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-leaflet-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          background: #0f172a !important;
        }
        .leaflet-control-attribution {
          background: rgba(15, 23, 42, 0.7) !important;
          color: #94a3b8 !important;
        }
        .leaflet-control-attribution a {
          color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
};

/* ── Metric Box ── */
const StatCard = ({ label, value, sub, change, changeColor, borderGlow }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:border-gray-300 ${borderGlow}`}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-6 -mt-6" />
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
    </div>
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`font-bold px-1.5 py-0.5 rounded ${changeColor}`}>
        {change}
      </span>
      <span className='text-gray-500 font-medium'>{sub}</span>
    </div>
  </div>
);

/* ── Forensic AI Page ── */
const FraudAnalytics = () => {  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Simulated File Forensic state
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResultMsg, setShowResultMsg] = useState(false);
  const [scanSummary, setScanSummary] = useState('');
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });

  // Persistent Threat Log Data
  const [threatLogs, setThreatLogs] = useState([]);

  // Fetch historical threats on load
  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user && user.workspace) {
          const res = await axios.get(`${NODE_URL}/api/threats/${user.workspace}`);
          // Ensure we have an array
          if (Array.isArray(res.data)) {
            setThreatLogs(res.data);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch historical threats`, e);
      }
    };
    fetchThreats();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunForensics = async (e) => {
    e.preventDefault();
    if (!file) return;
    setAnalyzing(true);
    setProgress(0);
    setShowResultMsg(false);

    // Fake progress bar animation for UI feel
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 400);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${PYTHON_URL}/api/fraud/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setProgress(100);
      setAnalyzing(false);
      setScanSummary(response.data?.summary || 'Analysis complete. Anomalies detected and logged.');
      setShowResultMsg(true);

      if (response.data && response.data.hotspots) {
        // Format the new hotspots slightly to match existing UI
        const newThreats = response.data.hotspots.map(h => ({
          ...h,
          id: Date.now() + Math.random()
        }));

        // Save new threats to database
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user && user.workspace) {
          try {
            const savedThreats = await Promise.all(
              newThreats.map(async (threat) => {
                const res = await axios.post(`${NODE_URL}/api/threats`, {
                  ...threat,
                  workspaceId: user.workspace
                });
                return res.data;
              })
            );
            setThreatLogs(prevLogs => [...savedThreats, ...prevLogs]);
          } catch (dbError) {
            console.error(`Failed to save threat to DB:`, dbError);
            // Fallback to local state if DB fails
            setThreatLogs(prevLogs => [...newThreats, ...prevLogs]);
          }
        } else {
          setThreatLogs(prevLogs => [...newThreats, ...prevLogs]);
        }
      }
    } catch (error) {
      console.error('Fraud Analysis Error:', error);
      clearInterval(interval);
      setAnalyzing(false);
      setErrorModal({ show: true, message: 'Error connecting to Forensic AI Engine. Ensure Python server is running.' });
    }
  };

  const getRiskBadge = (risk) => {
    if (risk === 'High') return 'bg-red-500/15 border border-red-500/30 text-red-400';
    return 'bg-amber-500/15 border border-amber-500/30 text-amber-400';
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Forensic AI</h1>
          </div>
        </header>

        {/* Scrollable Layout */}
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Total Invoices Screened"
              value="1,492"
              sub="across 14 active vendors"
              change="+14.2%"
              changeColor="bg-blue-500/15 text-blue-400"
              borderGlow="hover:shadow-[0_0_15px_rgba(56,189,248,0.08)]"
            />
            <StatCard
              label="Interceptions (High Risk)"
              value="34"
              sub="Flagged via heuristic signatures"
              change="Active Threat"
              changeColor="bg-red-500/15 text-red-400"
              borderGlow="hover:shadow-[0_0_15px_rgba(244,63,94,0.08)] border-red-950"
            />
            <StatCard
              label="Financial Fraud Prevented"
              value="$429.5K"
              sub="Prevented routing diversion"
              change="Safe Hold"
              changeColor="bg-emerald-500/15 text-emerald-400"
              borderGlow="hover:shadow-[0_0_15px_rgba(16,185,129,0.08)]"
            />
          </div>

          {/* Interactive Live Threat Map */}
          <ThreatMap
            hotspots={threatLogs}
            activeNode={hoveredNode}
            onHoverNode={setHoveredNode}
          />

          {/* CSV Forensics Upload & Live Logs Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: CSV Upload Forensics */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col justify-between h-fit lg:col-span-1">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Document Forensics
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Upload an invoice or document (PDF, TXT) to automatically parse and flag financial anomalies using Gemini 1.5.
                </p>

                <form onSubmit={handleRunForensics} className="mt-6 space-y-4">
                  <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative bg-gray-50/45 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,.csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={analyzing}
                    />
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-sm font-bold text-gray-600 truncate max-w-[180px]">
                      {file ? file.name : "Select document"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, TXT supported</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!file || analyzing}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 transition-all"
                  >
                    {analyzing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Scanning {progress}%
                      </>
                    ) : (
                      "Run AI Forensics Scan"
                    )}
                  </button>
                </form>
              </div>

              {/* Progress and results feedback */}
              <div className="mt-6">
                {analyzing && (
                  <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-200">
                    <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                )}

                {showResultMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 animate-fade-in-down">
                    <span className="text-lg shrink-0">🚨</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400">Scan Complete</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {scanSummary}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Threat Log */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Identified Threat Register
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider font-extrabold">
                        <th className="pb-3 pr-2">Vendor & Location</th>
                        <th className="pb-3 px-2">Anomaly Trigger</th>
                        <th className="pb-3 px-2 text-right">Invoice Amount</th>
                        <th className="pb-3 px-2">Risk</th>
                        <th className="pb-3 pl-2">Mitigation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {threatLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={`transition-colors group/row cursor-pointer ${hoveredNode?.id === log.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50/40'}`}
                          onClick={() => setHoveredNode(hoveredNode?.id === log.id ? null : log)}
                        >
                          <td className="py-3.5 pr-2 max-w-[140px]">
                            <div className="font-bold text-gray-900 group-hover/row:text-indigo-600 truncate transition-colors" title={log.vendor}>{log.vendor}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5 truncate">{log.location}</div>
                          </td>
                          <td className="py-3.5 px-2 font-mono text-gray-600 max-w-[150px] whitespace-normal leading-tight">{log.type}</td>
                          <td className="py-3.5 px-2 text-right font-extrabold text-gray-900">{log.amount}</td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getRiskBadge(log.risk)}`}>
                              {log.risk}
                            </span>
                          </td>
                          <td className="py-3.5 pl-2 max-w-[180px]">
                            <span className="font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200/80 group-hover/row:border-gray-300 inline-block whitespace-normal leading-tight">
                              {log.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-sm w-full relative transform transition-all">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg leading-6 font-bold text-gray-900 text-center mb-2">Analysis Failed</h3>
            <p className="text-sm text-gray-500 text-center mb-6">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ show: false, message: '' })}
              className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FraudAnalytics;
