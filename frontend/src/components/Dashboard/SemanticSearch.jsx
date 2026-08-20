import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const SemanticSearch = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);  const [queryCount, setQueryCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
      const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const selectDocument = async (doc) => {
    setSelectedDoc(doc);
    setIsLoading(true);
    try {
      const res = await axios.get(`${NODE_URL}/api/chat/${doc._id}`);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        setMessages([
          {
            role: 'ai',
            text: 'Document loaded... What would you like to know?',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setMessages([
        {
          role: 'ai',
          text: 'Document loaded... What would you like to know?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedDoc || isLoading) return;

    if (user.tier === 'free_trial' && queryCount >= 3) {
      setShowUpgradeModal(true);
      return;
    }
    if (user.tier === 'free_trial') setQueryCount(prev => prev + 1);

    const userMessage = { role: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${NODE_URL}/api/chat`, {
        documentId: selectedDoc._id,
        question: inputValue,
      });
      setMessages((prev) => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Sorry, I encountered an error analyzing this document. Please ensure the Node.js server is running and try again.', isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFileIcon = (name) => {
    if (name?.toLowerCase().endsWith('.pdf')) return '📄';
    if (name?.toLowerCase().endsWith('.csv')) return '📊';
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Semantic Search</h1>
          </div>
        </header>
        {/* Body: Two-panel layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT PANEL: Document List */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Vault</p>
              <p className="text-sm text-gray-500 mt-1">Select a document to chat with</p>
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
                    onClick={() => selectDocument(doc)}
                    
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      selectedDoc?._id === doc._id
                        ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedDoc?._id === doc._id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="text-lg">{getFileIcon(doc.originalName)}</span>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className={`text-sm font-bold truncate ${
                        selectedDoc?._id === doc._id ? 'text-indigo-700' : 'text-gray-700'
                      }`}>{doc.originalName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

{/* RIGHT PANEL: Chat Interface */}
          <div className="flex-1 flex flex-col bg-white">
            {!selectedDoc ? (
              // Empty state
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Select a Document to Begin</h2>
                  <p className="text-gray-500 mt-2 text-sm">Choose any file from your Intelligence Vault on the left. Gemini AI will read it and answer your questions instantly.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                  <span className="text-xl">{getFileIcon(selectedDoc.originalName)}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{selectedDoc.originalName}</p>
                    <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                      Powered by Gemini 1.5 Flash
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && (
                        <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : msg.isError
                            ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                            : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start items-center gap-3">
                      <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        <span className="text-xs text-gray-400">Gemini is reading your document...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ask anything about ${selectedDoc.originalName}...`}
                      rows={1}
                      className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </>
            )}
          </div>
        </div>
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Free Trial Limit Reached</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              You have used your 3 free AI queries. Upgrade to a Premium Subscription (Basic, Moderate, or Advanced) to unlock unlimited Legal AI capabilities for your team.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => window.location.href = 'mailto:sales@cognivault.com'} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all">
                Contact Sales to Upgrade
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
</div>
    </div>
  );
};

export default SemanticSearch;
