import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const HelpCenter = () => {  const [activeTab, setActiveTab] = useState('getting-started');

  const tabs = [
    { id: 'getting-started', label: 'Getting Started & Security', icon: '🛡️' },
    { id: 'vault', label: 'Intelligence Vault (Storage)', icon: '🗄️' },
    { id: 'tier1', label: 'Tier 1: Core AI Modules', icon: '⚡' },
    { id: 'tier2', label: 'Tier 2: Advanced Analytics', icon: '📈' },
    { id: 'tier3', label: 'Tier 3: Enterprise Intelligence', icon: '🧠' },
    { id: 'limits', label: 'Tier Quotas & Limits', icon: '⚖️' },
  ];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      {/* Sidebar */}
      <Sidebar currentTier={1} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Header */}
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Help Center & Documentation</h1>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Pane */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
            <div className="p-6 border-b border-gray-100">
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Documentation Topics</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <span className="text-lg grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto p-12 bg-white">
            <div className="max-w-4xl mx-auto">
              
              {activeTab === 'getting-started' && (
                <div className="animate-fade-in text-gray-600 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Getting Started & Security</h2>
                    <p className="text-gray-500 text-sm font-medium">Welcome to CogniVault. Here is what you need to know about getting started and how we secure your data.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Platform Overview</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        CogniVault is an AI-powered enterprise platform designed to process, analyze, and secure organizational data. 
                        Your journey begins by uploading documents to the <strong>Intelligence Vault</strong>. From there, depending on your subscription tier, you can run advanced AI modules (like Semantic Search, Contract Redlining, or Privacy Redaction) on your stored data.
                      </p>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Security & Privacy (Zero-Knowledge Architecture)</h3>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="mt-0.5"><span className="bg-green-100 text-green-700 p-1.5 rounded-lg flex items-center justify-center w-8 h-8"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span></div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">End-to-End Encryption (E2EE)</h4>
                            <p className="text-sm text-gray-600 leading-relaxed mt-1">All documents uploaded to the Vault are encrypted both in transit (TLS 1.3) and at rest (AES-256). We cannot read your raw files without your workspace authorization keys.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="mt-0.5"><span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg flex items-center justify-center w-8 h-8"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></span></div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">AI Data Isolation</h4>
                            <p className="text-sm text-gray-600 leading-relaxed mt-1">When you use our AI modules, your documents are processed in an isolated container. <strong>Your data is never used to train global AI models.</strong> Everything is strictly sandboxed to your specific workspace tenant.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="mt-0.5"><span className="bg-red-100 text-red-700 p-1.5 rounded-lg flex items-center justify-center w-8 h-8"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></span></div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Active Threat Detection</h4>
                            <p className="text-sm text-gray-600 leading-relaxed mt-1">Our platform actively monitors access velocity. If a compromised account attempts to mass-download or exfiltrate documents, the system instantly triggers a lockdown and suspends the user.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}              {activeTab === 'vault' && (
                <div className="animate-fade-in text-gray-600 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Intelligence Vault</h2>
                    <p className="text-gray-500 text-sm font-medium">Your secure document repository.</p>
                  </div>
                  
                  <div className="prose prose-indigo max-w-none text-sm leading-relaxed">
                    <p>The Intelligence Vault is the foundational module of CogniVault. Before any AI module can perform analysis, documents must be securely ingested into the Vault.</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Supported File Formats</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">PDF</span>
                        <h4 className="font-bold text-gray-900 mt-3">Standard Documents</h4>
                        <p className="text-xs mt-1">Fully supported across all modules. Optimal for AI Classification and Redlining.</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">DOCX</span>
                        <h4 className="font-bold text-gray-900 mt-3">Word Documents</h4>
                        <p className="text-xs mt-1">Fully supported. Used extensively by the Generative Drafter for exports.</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">TXT</span>
                        <h4 className="font-bold text-gray-900 mt-3">Plain Text</h4>
                        <p className="text-xs mt-1">Supported for basic semantic search, but lacks structural formatting required by OCR.</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">CSV</span>
                        <h4 className="font-bold text-gray-900 mt-3">Data Spreadsheets</h4>
                        <p className="text-xs mt-1">Fully supported. Highly recommended for bulk data analysis and the Financial Forecaster module.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tier1' && (
                <div className="animate-fade-in text-gray-600 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Tier 1 Modules</h2>
                    <p className="text-gray-500 text-sm font-medium">Core AI analysis tools available to all users.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span>
                        Executive Summary
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Instantly generates a one-page executive brief for massive legal documents, highlighting involved parties, key obligations, financial terms, and termination clauses.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Select a document from your Vault and click 'Generate Brief'.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg></span>
                        AI Classification
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Automatically scans newly uploaded documents and categorizes them (e.g., Employment Contract, NDA, Merger Agreement) while extracting key metadata like effective dates and parties involved.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Navigate to the module, select an unclassified document from the Vault, and click 'Run Classification Engine'.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                        Semantic Search
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Unlike keyword search (CTRL+F), Semantic Search understands the <i>meaning</i> of your query. You can ask "Show me clauses related to early termination penalties" and it will find relevant paragraphs even if those exact words aren't used.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Type natural language questions in the search bar. The AI will cite exact page numbers and document names.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></span>
                        Automated Redlining
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Compares third-party contracts against your internal legal playbook to flag unacceptable terms (e.g., unlimited liability caps, missing indemnity clauses) and suggests strike-throughs and alternate language.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tier2' && (
                <div className="animate-fade-in text-gray-600 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Tier 2 Modules</h2>
                    <p className="text-gray-500 text-sm font-medium">Advanced risk and financial analytics.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></span>
                        Vendor Risk Screening
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Scans Master Service Agreements (MSAs) and vendor contracts for hidden risks, non-compete violations, and unacceptable SLA downtime provisions. Generates a "Risk Score" out of 100.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Navigate to the module, select a contract from your Vault, and click 'Run Scanner'.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></span>
                        Financial Forecaster
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Parses complex pricing tiers, recurring revenue models, and penalty clauses across hundreds of documents to project potential financial liabilities or revenue generation over a 5-year timeline.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Select a financial contract and click 'Generate Forecast' to build the 5-year model.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></span>
                        Privilege Sentinel
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Acts as a firewall for your internal communications. It scans emails and memos to ensure Attorney-Client Privilege is maintained, flagging sentences that might waive privilege in a court of law.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Select a communication record and click 'Scan for Privilege' to detect waiver risks.</span>
                    </div>
                    
                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></span>
                        Privacy Redactor
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Automatically scans documents for Personally Identifiable Information (PII) like SSNs, Credit Cards, and Phone Numbers. Redacts them instantly before sharing documents externally.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Load a document into the module and click 'Redact PII' to mask sensitive data.</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tier3' && (
                <div className="animate-fade-in text-gray-600 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Tier 3 Modules</h2>
                    <p className="text-gray-500 text-sm font-medium">Enterprise-grade intelligence and generation.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
                        Forensic AI
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Cross-references employee communications, expense reports, and access logs to detect subtle patterns indicative of corporate fraud, embezzlement, or intellectual property theft. Includes anomaly detection visualization.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Select data clusters within the Forensic AI dashboard to detect behavioral anomalies.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span>
                        Knowledge Graph
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Visualizes the interconnected web of entities (Companies, Individuals, Contracts, Assets) across your entire Vault. Perfect for M&A due diligence to uncover hidden dependencies.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Navigate to Knowledge Graph to instantly view the interactive relationship nodes.</span>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></span>
                        AI Contract Drafting
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">An interactive chat interface where you can instruct the AI to draft entirely new contracts from scratch. It uses your existing Vault documents as precedent to ensure tone and formatting match your company's style.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Open Generative Drafter and chat with the AI to author new legal precedents.</span>
                    </div>
                    
                    <div className="p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                        Compliance Oracle
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">Connects to live regulatory databases (SEC, GDPR, HIPAA) to instantly audit your documents against the latest global compliance laws. It highlights exactly which clauses violate new legislation.</p>
                      <strong className="text-xs text-gray-900">How to use:</strong> <span className="text-xs">Select a document and run an Oracle audit to cross-reference active regulations.</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'limits' && (
                <div className="animate-fade-in text-gray-600 space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Tier Quotas & Limits</h2>
                    <p className="text-gray-500 text-sm font-medium">Usage limitations based on your active subscription.</p>
                  </div>
                  
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-200">
                        <tr>
                          <th className="p-4">Feature Metric</th>
                          <th className="p-4 border-l border-gray-200">Basic Tier</th>
                          <th className="p-4 border-l border-gray-200">Moderate Tier</th>
                          <th className="p-4 border-l border-gray-200 bg-indigo-50/50 text-indigo-900">Advanced / Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="p-4 font-semibold text-gray-800">Available Modules</td>
                          <td className="p-4 border-l border-gray-200">Tier 1 Only</td>
                          <td className="p-4 border-l border-gray-200">Tier 1 + 2</td>
                          <td className="p-4 border-l border-gray-200 bg-indigo-50/50 font-bold text-indigo-700">All Tiers (1, 2, 3)</td>
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold text-gray-800">Vault Capacity</td>
                          <td className="p-4 border-l border-gray-200">Unlimited</td>
                          <td className="p-4 border-l border-gray-200">Unlimited</td>
                          <td className="p-4 border-l border-gray-200 bg-indigo-50/50">Unlimited</td>
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold text-gray-800">Max File Size</td>
                          <td className="p-4 border-l border-gray-200">50 MB</td>
                          <td className="p-4 border-l border-gray-200">50 MB</td>
                          <td className="p-4 border-l border-gray-200 bg-indigo-50/50">50 MB</td>
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold text-gray-800">Semantic Queries</td>
                          <td className="p-4 border-l border-gray-200">Unlimited</td>
                          <td className="p-4 border-l border-gray-200">Unlimited</td>
                          <td className="p-4 border-l border-gray-200 bg-indigo-50/50">Unlimited</td>
                        </tr>
                        <tr>
                          <td className="p-4 font-semibold text-gray-800">Active Seats</td>
                          <td className="p-4 border-l border-gray-200">1 Seat</td>
                          <td className="p-4 border-l border-gray-200">Up to 2 Seats</td>
                          <td className="p-4 border-l border-gray-200 bg-indigo-50/50">Up to 3 Seats</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
