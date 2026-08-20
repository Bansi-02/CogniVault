import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Sidebar from './Sidebar';

const GenerativeDrafter = () => {  
  // Wizard State
  const [docType, setDocType] = useState('Non-Disclosure Agreement (NDA)');
  const [vendorName, setVendorName] = useState('');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [jurisdiction, setJurisdiction] = useState('New York, USA');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!vendorName) return setError('Vendor Name is required.');
    
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${PYTHON_URL}/api/drafter/generate`, {
        document_type: docType,
        vendor_name: vendorName,
        risk_level: riskLevel,
        jurisdiction: jurisdiction,
        effective_date: effectiveDate,
        special_instructions: specialInstructions
      });
      setDraft(res.data.document);
      setIsEditing(false);
    } catch (err) {
      setError('Could not connect to the Smart Clause Engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!draft) return;
    
    // Convert HTML to plain text for export
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = draft;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vendorName.replace(/\s+/g, '_')}_${docType.split(' ')[0]}_Contract.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Contract Drafting</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Configuration Wizard */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Document Configuration
            </h2>
            
            <form onSubmit={handleGenerate} className="flex flex-col gap-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Document Type</label>
                <select 
                  value={docType} 
                  onChange={e => setDocType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option>Non-Disclosure Agreement (NDA)</option>
                  <option>Data Processing Agreement (DPA)</option>
                  <option>Master Service Agreement (MSA)</option>
                  <option>Software License Agreement (SLA)</option>
                  <option>Employment Contract</option>
                  <option>Vendor Agreement</option>
                  <option>Partnership Agreement</option>
                  <option>Terms of Service (ToS)</option>
                  <option>Consulting Agreement</option>
                  <option>Memorandum of Understanding (MoU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vendor / Counterparty Name</label>
                <input 
                  type="text" 
                  value={vendorName} 
                  onChange={e => setVendorName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assessed Risk Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map(level => (
                    <button 
                      key={level}
                      type="button"
                      onClick={() => setRiskLevel(level)}
                      className={`py-2 text-sm font-bold border rounded-lg transition-colors ${
                        riskLevel === level 
                          ? level === 'High' ? 'bg-red-50 border-red-200 text-red-700' 
                          : level === 'Medium' ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 leading-snug">
                  High Risk automatically injects strict audit rights and termination clauses into the generated draft.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Jurisdiction</label>
                <input 
                  type="text" 
                  value={jurisdiction} 
                  onChange={e => setJurisdiction(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Effective Date</label>
                <input 
                  type="date" 
                  value={effectiveDate} 
                  onChange={e => setEffectiveDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Special Instructions
                  <span className="ml-1.5 text-indigo-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  rows={3}
                  placeholder={`e.g. "Include a ₹10L penalty clause for breach", "Add a 2-year non-compete", "Ensure data deletion within 30 days"`}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none placeholder:text-gray-300"
                />
                <p className="text-xs text-gray-400 mt-1 leading-snug">Gemini will incorporate these requirements directly into the draft.</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? 'Drafting Contract...' : 'Generate Legal Draft'}
              </button>
              
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            </form>
          </div>

          {/* Right Panel: Output Viewer */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Generated Contract
              </h2>
              <div className="flex items-center gap-3">
                {draft && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                      isEditing
                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                        : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {isEditing ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Preview</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Edit</>  
                    )}
                  </button>
                )}
                {draft && (
                  <button onClick={handleDownload} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export as Text
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-8 overflow-y-auto font-serif text-gray-800 leading-loose prose max-w-none">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-10 h-10 animate-spin mb-4 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <p className="font-sans font-bold">Assembling Smart Clauses...</p>
                </div>
              ) : draft ? (
                isEditing ? (
                  <div className="h-full min-h-[600px] flex flex-col -mx-4 -my-4">
                    <style>{`
                      .ql-container { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; font-size: 15px; border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }
                      .ql-toolbar { border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; background-color: #f8fafc; }
                      .ql-editor { min-height: 500px; line-height: 1.8; }
                    `}</style>
                    <ReactQuill
                      theme="snow"
                      value={draft}
                      onChange={setDraft}
                      className="flex-1 bg-white rounded-xl"
                    />
                  </div>
                ) : (
                <div 
                  className="contract-document prose prose-indigo max-w-none text-gray-800 leading-loose" 
                  dangerouslySetInnerHTML={{ __html: draft }} 
                />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 font-sans">
                  <p className="text-lg font-bold">No draft generated</p>
                  <p className="text-sm max-w-sm text-center mt-2">Configure the document parameters on the left and click Generate to assemble the contract.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerativeDrafter;
