import { NODE_URL } from '../../config/api';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import html2pdf from 'html2pdf.js';

const Redlining = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [docData, setDocData] = useState(null);
  const [activeRisk, setActiveRisk] = useState(null);
  const [resolvedRisks, setResolvedRisks] = useState({});
  const [loading, setLoading] = useState(false);  const [exportMessage, setExportMessage] = useState('');
  const docRef = useRef(null);

  // Fetch docs from vault
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
        const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, []);

  const handleSelectDoc = async (id) => {
    setSelectedDocId(id);
    setLoading(true);
    setActiveRisk(null);
    setResolvedRisks({});
    setExportMessage(``);
    try {
      const res = await axios.get(`${NODE_URL}/api/documents/${id}/redline`);
      setDocData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRedline = (risk) => {
    setResolvedRisks(prev => ({ ...prev, [risk.id]: true }));
    setActiveRisk(null);
  };

  const handleExport = () => {
    if (!docRef.current) return;
    setExportMessage('Exporting marked-up PDF...');
    
    const selectedDoc = documents.find(d => d._id === selectedDocId);
    const opt = {
      margin: 10,
      filename: `Redlined_${selectedDoc?.originalName || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(docRef.current).save().then(() => {
      setExportMessage('Export complete! Redlined contract saved to downloads.');
      setTimeout(() => setExportMessage(''), 3000);
    }).catch(err => {
      console.error("PDF Export Error:", err);
      setExportMessage('Error exporting PDF.');
      setTimeout(() => setExportMessage(''), 3000);
    });
  };

  // Function to render the text with interactive highlights and resolved redlines
  const renderDocumentText = () => {
    if (!docData) return null;

    let elements = [];
    let currentIndex = 0;
    const text = docData.text;

    // We must sort risks by where they appear in the text so we can process sequentially.
    // Since we only have 'originalText', we'll find their indices.
    const riskInstances = docData.risks.map(r => {
      return { ...r, index: text.indexOf(r.originalText) };
    }).filter(r => r.index !== -1).sort((a, b) => a.index - b.index);

    riskInstances.forEach((risk) => {
      // Add text before the risk
      if (risk.index > currentIndex) {
        elements.push(<span key={`text-${currentIndex}`}>{text.substring(currentIndex, risk.index)}</span>);
      }

      const isResolved = resolvedRisks[risk.id];
      const isSelected = activeRisk?.id === risk.id;

      if (isResolved) {
        // Show Track Changes (Redline mode)
        elements.push(
          <span key={risk.id} className="relative group cursor-pointer border-b border-dashed border-gray-300">
            <span className="line-through text-red-500 bg-red-50 px-1 rounded-sm mr-1">
              {risk.originalText}
            </span>
            <span className="text-green-700 bg-green-50 font-semibold px-1 rounded-sm border border-green-200">
              {risk.suggestion}
            </span>
          </span>
        );
      } else {
        // Show active highlight
        const colorClass = risk.severity === 'critical' || risk.severity === 'high' 
          ? 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200' 
          : 'bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200';
        
        const selectedClass = isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 z-10 relative' : '';

        elements.push(
          <span 
            key={risk.id}
            onClick={() => setActiveRisk(risk)}
            className={`cursor-pointer px-1 rounded-sm border ${colorClass} transition-colors ${selectedClass}`}
          >
            {risk.originalText}
          </span>
        );
      }

      currentIndex = risk.index + risk.originalText.length;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      elements.push(<span key={`text-${currentIndex}`}>{text.substring(currentIndex)}</span>);
    }

    return (
    <div className="whitespace-pre-wrap leading-loose text-gray-800">
        {elements}
      </div>
    );
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Automated Redlining</h1>
          </div>
        </header>

        {/* Body: Two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL: Document List */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Vault</p>
              <p className="text-sm text-gray-500 mt-1">Select a document to scan</p>
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
                    disabled={loading ? true : false}
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

{/* RIGHT PANEL: Main Content Area */}
          <div className="flex-1 overflow-hidden flex bg-gray-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-[3px] border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-bold text-gray-700">Scanning document...</p>
              </div>
            ) : !docData ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Automated Redlining</h2>
                <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                  Select a document from the left to automatically detect risky clauses and suggest standard redlines.
                </p>
              </div>
            ) : (
              <>
                {/* Document Viewer Column */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-white">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 truncate">Document Text</h2>
                    <div className="flex items-center gap-4">
                      {exportMessage && <span className="text-sm font-bold text-emerald-600 animate-pulse">{exportMessage}</span>}
                      <button onClick={handleExport} className="text-sm bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-lg hover:bg-indigo-700 shadow transition-colors">
                        Export PDF
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 font-serif text-lg leading-loose text-gray-800" ref={docRef}>
                    {renderDocumentText()}
                  </div>
                </div>

                {/* Risks Sidebar Column */}
                <div className="w-80 bg-[#f8fafc] flex flex-col flex-shrink-0">
                  <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-bold text-gray-900">Detected Risks</h2>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                      {docData.risks.filter(r => !resolvedRisks[r.id]).length} Pending
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {docData.risks.map(risk => (
                      <div 
                        key={risk.id}
                        className={`p-4 rounded-xl border transition-all ${
                          activeRisk?.id === risk.id 
                            ? 'bg-white border-indigo-300 shadow-md ring-1 ring-indigo-500' 
                            : resolvedRisks[risk.id]
                              ? 'bg-gray-50 border-gray-200 opacity-60'
                              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                        }`}
                        onClick={() => !resolvedRisks[risk.id] && setActiveRisk(risk)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            risk.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                            risk.severity === 'high' ? 'bg-orange-100 text-orange-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {risk.severity} Risk
                          </span>
                          {resolvedRisks[risk.id] && (
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 font-medium mb-3">{risk.issue}</p>
                        
                        {!resolvedRisks[risk.id] && activeRisk?.id === risk.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Suggested Redline</p>
                            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 font-semibold mb-4">
                              {risk.suggestion}
                            </p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleAcceptRedline(risk); }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 rounded-lg transition-colors shadow-sm"
                            >
                              Accept & Apply
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Redlining;
