import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';
import Footer from './Footer';

import Navbar from './Navbar';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      title: 'Intelligence Vault',
      desc: 'Securely store and organize all your enterprise documents with military-grade encryption.',
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      title: 'AI Classification',
      desc: 'Scikit-Learn powered Random Forest model instantly categorizes every uploaded contract.',
      color: 'from-cyan-500 to-cyan-700',
    },
    {
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      title: 'Semantic Search (RAG)',
      desc: 'Chat with your documents using Gemini AI. Get instant clause-level answers.',
      color: 'from-indigo-500 to-indigo-700',
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Vendor Risk Screening',
      desc: 'NLP sentiment analysis on live vendor data from third-party APIs. Get a Trust Score in seconds.',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      title: 'Financial Forecaster',
      desc: 'ML Regression models predict the 5-year cost trajectory of every contract you sign.',
      color: 'from-teal-500 to-teal-700',
    },
    {
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      title: 'Forensic AI',
      desc: 'Isolation Forest anomaly detection scans financial CSVs to catch hidden billing fraud.',
      color: 'from-red-500 to-red-700',
    },
  ];



  return (
    <div className="min-h-screen bg-[#080c18] text-white font-sans overflow-x-hidden">

      {/* Ambient background and Live Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-15%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]" />
        <ParticleBackground />
      </div>

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── HERO SECTION ── */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center min-h-[90vh]">
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center pt-10 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Trusted by Enterprise
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-normal leading-[1.25] mb-16">
              <span className="whitespace-nowrap block">Legal &amp; Financial Intelligence,</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 block mt-3 pb-3">
                Powered by AI.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl mb-14 leading-relaxed">
              Stop losing thousands of hours to manual review. CogniVault instantly extracts risk, forecasts financials, and semantically searches your entire corporate repository.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <Link to="/login" state={{ mode: 'trial' }} className="px-8 py-4 bg-white text-black font-extrabold rounded-xl hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] flex justify-center items-center gap-2">
                Start Free Trial
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>



          {/* ── TRUSTED BY BANNER ── */}
          <div className="mt-16">
            <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">Trusted by visionary legal teams at</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
              <div className="text-2xl font-black tracking-tighter flex items-center gap-3"><svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg> ACME CORP</div>
              <div className="text-2xl font-black tracking-widest flex items-center gap-3"><svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg> GLOBEX</div>
              <div className="text-2xl font-serif italic font-bold flex items-center gap-3"><svg className="w-8 h-8 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg> SOYUZ LLC</div>
              <div className="text-2xl font-black uppercase flex items-center gap-3"><svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4"/></svg> WAYNE ENT.</div>
              <div className="text-2xl font-bold uppercase flex items-center gap-3 hidden md:flex"><svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> STARK IND.</div>
            </div>
          </div>

        </div>
      </div>


      {/* ── ABSTRACT VALUE BENTO ── */}
      <div className="pt-8 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">The new standard of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Intelligence</span></h2>
            <p className="text-lg text-gray-400 font-medium">CogniVault completely re-engineers how legal data is processed, turning thousands of hours of manual review into split-second automated extraction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
            
            {/* Box 1: 10x Faster Review (Wide) */}
            <div className="md:col-span-2 md:row-span-1 bg-[#050914]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group transition-all duration-700 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-indigo-500/30 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 transform group-hover:translate-x-2 transition-transform duration-700">
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight">10x Faster Review</h3>
                <p className="text-gray-400 font-medium text-lg max-w-sm leading-relaxed">
                  What used to take an entire legal team weeks of manual reading is now extracted, analyzed, and summarized in milliseconds.
                </p>
              </div>
              <div className="relative z-10 h-32 w-full mt-4 flex items-end">
                {/* Abstract glowing sparkline */}
                <div className="w-full h-full relative overflow-hidden flex items-end opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent" />
                  <svg className="w-full h-full text-indigo-400" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,100 L0,80 Q10,60 20,70 T40,40 T60,60 T80,20 L100,0 L100,100 Z" fill="currentColor" opacity="0.3"/>
                    <path d="M0,80 Q10,60 20,70 T40,40 T60,60 T80,20 L100,0" fill="none" stroke="currentColor" strokeWidth="2" />
                    {/* Glowing dots */}
                    <circle cx="20" cy="70" r="2" fill="white" className="animate-pulse" />
                    <circle cx="40" cy="40" r="2" fill="white" className="animate-pulse" style={{ animationDelay: '200ms' }} />
                    <circle cx="60" cy="60" r="2" fill="white" className="animate-pulse" style={{ animationDelay: '400ms' }} />
                    <circle cx="80" cy="20" r="3" fill="#818cf8" className="shadow-[0_0_10px_#818cf8]" />
                    <circle cx="100" cy="0" r="4" fill="#818cf8" className="shadow-[0_0_15px_#818cf8]" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Box 2: Zero-Trust Security (Square) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#050914]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group transition-all duration-700 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-emerald-500/30 flex flex-col justify-between items-center text-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 w-full flex-1 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700">
                {/* Abstract Security Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[25px] animate-pulse group-hover:bg-emerald-500/40 transition-colors duration-700" />
                  <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.2)] backdrop-blur-md">
                    <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-8 transform group-hover:-translate-y-2 transition-transform duration-700">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Zero-Trust Security</h3>
                <p className="text-gray-400 font-medium text-sm leading-relaxed">Military-grade 256-bit AES encryption ensures your data never leaves your control.</p>
              </div>
            </div>

            {/* Box 3: Zero Human Error (Square) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#050914]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group transition-all duration-700 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-cyan-500/30 flex flex-col justify-between items-center text-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 w-full flex-1 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700">
                {/* Abstract AI Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[25px] group-hover:scale-150 transition-transform duration-1000" />
                  <div className="w-24 h-24 flex items-center justify-center relative z-10">
                     <div className="w-full h-full border-[4px] border-cyan-500/20 rounded-full animate-[spin_6s_linear_infinite]" />
                     <div className="absolute inset-0 border-[4px] border-cyan-400/50 rounded-full border-t-transparent animate-[spin_4s_linear_infinite_reverse]" />
                     <div className="absolute w-10 h-10 bg-cyan-400 rounded-full blur-[8px] opacity-90 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_20px_#22d3ee]" />
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-8 transform group-hover:-translate-y-2 transition-transform duration-700">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Zero Human Error</h3>
                <p className="text-gray-400 font-medium text-sm leading-relaxed">Eliminate fatigue-based mistakes. AI agents catch liabilities that tired eyes miss.</p>
              </div>
            </div>

            {/* Box 4: Universal Integration (Wide) */}
            <div className="md:col-span-2 md:row-span-1 bg-[#050914]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group transition-all duration-700 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_rgba(217,70,239,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-fuchsia-500/30 flex flex-col md:flex-row items-center gap-10 justify-between">
              <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 flex-1 max-w-sm transform group-hover:translate-x-2 transition-transform duration-700">
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Universal Integration</h3>
                <p className="text-gray-400 font-medium text-lg leading-relaxed">
                  Connects seamlessly to your existing tech stack. Drive, Dropbox, AWS, or local servers—CogniVault ingests it all automatically.
                </p>
              </div>
              <div className="relative z-10 flex-1 w-full flex justify-center items-center gap-4 opacity-60 group-hover:opacity-100 transform group-hover:-translate-x-2 transition-all duration-700">
                 {/* Abstract connection nodes */}
                 <div className="w-14 h-14 rounded-[1.25rem] bg-[#0b101d] border border-white/5 shadow-inner flex items-center justify-center animate-pulse group-hover:border-fuchsia-500/30 transition-colors"><div className="w-4 h-4 bg-fuchsia-400/50 rounded-full shadow-[0_0_10px_#e879f9]"/></div>
                 <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
                 <div className="w-20 h-20 rounded-[1.5rem] bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(217,70,239,0.2)] backdrop-blur-md">
                   <svg className="w-10 h-10 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                 </div>
                 <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
                 <div className="w-14 h-14 rounded-[1.25rem] bg-[#0b101d] border border-white/5 shadow-inner flex items-center justify-center animate-pulse group-hover:border-fuchsia-500/30 transition-colors" style={{ animationDelay: '500ms'}}><div className="w-4 h-4 bg-fuchsia-400/50 rounded-full shadow-[0_0_10px_#e879f9]"/></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FEATURES TEASER ── */}
      <div id="features" className="pt-12 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
            The Complete Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">
            Explore our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">12 AI Agents</span>
          </h2>
          <p className="text-lg text-gray-400 font-medium mb-12">
            From automated redlining to forensic billing analysis, step inside the command center and explore the full suite of tools built for the modern legal enterprise.
          </p>
          <Link to="/features" className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors inline-flex justify-center items-center gap-2 backdrop-blur-sm group hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            Enter the Command Center
            <svg className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
};

export default Landing;
