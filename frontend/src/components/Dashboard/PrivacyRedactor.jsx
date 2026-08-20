import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const PrivacyRedactor = () => {  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [documentContent, setDocumentContent] = useState('');
  const [redactedContent, setRedactedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedacted, setIsRedacted] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const userStr = sessionStorage.getItem('cognivault_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
        setDocuments(res.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };
    fetchDocuments();
  }, []);

  const handleSelectDoc = async (id) => {
    setSelectedDocId(id);
    setRedactedContent('');
    setIsRedacted(false);
    setError('');
    setLoading(true);

    try {
      const userStr = sessionStorage.getItem('cognivault_user');
      const user = JSON.parse(userStr);
      const res = await axios.get(`${NODE_URL}/api/documents/${id}/content?userId=${user.id}`);
      setDocumentContent(res.data.text || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch document content.');
      setDocumentContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleRedact = async () => {
    if (!documentContent) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${PYTHON_URL}/api/ai/redact`, {
        text: documentContent
      });
      setRedactedContent(res.data.redacted_text);
      setIsRedacted(true);
    } catch (err) {
      console.error(`AI Redaction error:`, err);
      setError(err.response?.data?.detail || 'Failed to redact document using AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([redactedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const originalName = documents.find(d => d._id === selectedDocId)?.originalName || 'document';
    element.download = `REDACTED_${originalName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Privacy Redactor</h1>
          </div>
        </header>

        <div className="flex-1 flex h-full overflow-hidden">
          {/* Document List Panel */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Vault</p>
              <p className="text-sm text-gray-500 mt-1">Select a document to redact</p>
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

{/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-8 gap-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
            )}

            {!selectedDocId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">🛡️</span>
                </div>
                <p className="font-bold text-gray-600 text-lg mb-2">AI-Powered PII Redaction</p>
                <p className="text-sm max-w-sm">Select a document from the left panel to load it, then click Redact to automatically remove all personally identifiable information.</p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <svg className="w-10 h-10 animate-spin mb-4 text-purple-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="font-bold">Processing...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex gap-4 shrink-0">
                  <button
                    onClick={handleRedact}
                    disabled={!documentContent || loading}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🛡️ Redact PII with AI
                  </button>
                  {isRedacted && (
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                    >
                      ⬇️ Download Redacted
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden min-h-0">
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Original Document</p>
                    <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">{documentContent}</div>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Redacted Output {isRedacted && <span className="text-emerald-600">✓ Redacted</span>}</p>
                    <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                      {isRedacted ? redactedContent : <span className="text-gray-400 italic">Redacted content will appear here after processing.</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyRedactor;
