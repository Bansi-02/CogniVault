import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useRef, useCallback } from 'react';
import ParticleBackground from './ParticleBackground';
import Navbar from './Navbar';
import axios from 'axios';

const Partnerships = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('india');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1 && company && email) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => setStep(step - 1);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'image/svg+xml' || selectedFile.name.toLowerCase().endsWith('.svg'))) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      alert("Please upload a valid .svg file.");
      setFile(null);
      setFilePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!company || !email || !region || !file) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append('company', company);
    formData.append('email', email);
    formData.append('placement', 'public_website');
    formData.append('region', region);
    formData.append('banner', file);

    try {
      await axios.post(`${NODE_URL}/api/partnerships`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c18] text-white font-sans overflow-x-hidden pb-24">
      <Navbar />
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-15%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <ParticleBackground />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-32 z-10 flex flex-col lg:flex-row gap-16 items-center">
        {/* Left Copy */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            CogniVault Ads Manager
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Promote your software to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">top-tier law firms.</span>
          </h2>
          
          <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-xl">
            CogniVault is actively used by Managing Partners, General Counsels, and Compliance Officers at Fortune 500 companies. Reach the decision-makers directly inside their secure workflow.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <div className="text-3xl font-black text-white">12k+</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Legal Pros</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-black text-white">$2.4B</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contracts Analyzed</div>
            </div>
          </div>
        </div>

        {/* Right Form: Multi-Step Advertiser Intake */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-[#0b101d]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group min-h-[480px] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 relative z-10">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Assets Received</h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                  Your creative assets and campaign preferences have been securely uploaded. Our ad ops team will contact you at {email} within 24 hours to finalize your campaign.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-xl font-black text-white">Setup Campaign</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${step >= i ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  {/* STEP 1 */}
                  {step === 1 && (
                    <form onSubmit={handleNext} className="animate-in slide-in-from-right-4 duration-300 space-y-5">
                      <h4 className="text-lg font-bold text-white mb-1">Advertiser Profile</h4>
                      <p className="text-xs text-gray-400 mb-6">Tell us about the company you are promoting.</p>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                        <input value={company} onChange={e => setCompany(e.target.value)} required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50" placeholder="e.g. Acme Corp" />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value.replace(/\s/g, ''))} required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50" placeholder="marketing@acmecorp.com" />
                      </div>

                      <button type="submit" className="w-full py-4 mt-6 bg-white hover:bg-gray-200 text-black rounded-xl font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                        Next: Campaign Details
                      </button>
                    </form>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <form onSubmit={handleNext} className="animate-in slide-in-from-right-4 duration-300 space-y-5">
                      <h4 className="text-lg font-bold text-white mb-1">Company Region</h4>
                      <p className="text-xs text-gray-400 mb-6">Select your company's location for accurate pricing.</p>
                      
                      <div className="space-y-3">
                        <label className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${region === 'india' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <input 
                            type="radio" 
                            name="region" 
                            value="india" 
                            checked={region === 'india'} 
                            onChange={(e) => setRegion(e.target.value)}
                            className="mt-1 w-4 h-4 text-indigo-500 bg-black border-white/20 focus:ring-indigo-500 focus:ring-2"
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-bold text-white">Based in India</span>
                            <span className="block text-xs text-gray-400 mt-1">Placement: Public Website</span>
                            <span className="block text-sm font-black text-indigo-400 mt-2">₹6,000 / month</span>
                          </div>
                        </label>
                        
                        <label className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${region === 'international' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <input 
                            type="radio" 
                            name="region" 
                            value="international" 
                            checked={region === 'international'} 
                            onChange={(e) => setRegion(e.target.value)}
                            className="mt-1 w-4 h-4 text-indigo-500 bg-black border-white/20 focus:ring-indigo-500 focus:ring-2"
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-bold text-white">International (Outside India)</span>
                            <span className="block text-xs text-gray-400 mt-1">Placement: Public Website</span>
                            <span className="block text-sm font-black text-indigo-400 mt-2">$120 / month</span>
                          </div>
                        </label>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button type="button" onClick={handleBack} className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all border border-white/10">
                          Back
                        </button>
                        <button type="submit" className="w-2/3 py-4 bg-white hover:bg-gray-200 text-black rounded-xl font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                          Next: Upload Asset
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-5">
                      <h4 className="text-lg font-bold text-white mb-1">Creative Upload</h4>
                      <p className="text-xs text-gray-400 mb-6">Upload your resolution-independent SVG banner.</p>
                      
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${filePreview ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'}`}
                      >
                        {filePreview ? (
                          <div className="space-y-4 w-full flex flex-col items-center">
                            <div className="w-24 h-24 bg-white/5 rounded-xl border border-white/10 p-2 flex items-center justify-center">
                              <img src={filePreview} alt="SVG Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-indigo-400">{file.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Click to replace SVG</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/10">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white mb-1">Click to upload SVG banner</p>
                              <p className="text-xs text-gray-500">Max size 5MB. Must be .svg format.</p>
                              <p className="text-[10px] text-indigo-400 mt-2 font-bold uppercase tracking-wider">💡 Tip: Portrait aspect ratio (e.g. 9:14) looks best</p>
                            </div>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept=".svg, image/svg+xml" 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={handleFileChange}
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={handleBack} disabled={loading} className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all border border-white/10 disabled:opacity-50">
                          Back
                        </button>
                        <button 
                          onClick={handleSubmit} 
                          disabled={!file || loading} 
                          className="w-2/3 py-4 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-white rounded-xl font-black text-sm shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                          {loading ? 'Uploading...' : 'Submit Campaign Assets'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partnerships;
