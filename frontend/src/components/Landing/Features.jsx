import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ParticleBackground from './ParticleBackground';

const allFeatures = [
  { title: 'Executive Summary', desc: 'Instantly generate a one-page executive brief for massive legal documents. Highlights involved parties, key obligations, financial terms, and termination clauses.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'from-blue-500 to-indigo-600' },
  { title: 'AI Classification', desc: 'Automatically sort, tag, and organize thousands of unstructured documents into standardized taxonomies. Instantly separates NDAs, MSAs, and DPAs without manual data entry.', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', color: 'from-amber-400 to-orange-500' },
  { title: 'Semantic Search', desc: 'Instantly retrieve critical clauses and precedents using our proprietary neural search engine. It understands legal context, synonyms, and complex querying beyond exact keyword matching.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'from-purple-500 to-pink-600' },
  { title: 'Automated Redlining', desc: 'Automate contract negotiations with AI-driven redlining. Instantly compare drafts, highlight risk exposure, and generate counter-clauses aligned with your internal legal playbooks.', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', color: 'from-rose-500 to-orange-500' },
  { title: 'Vendor Risk Screen', desc: 'Continuously monitor third-party vendors for regulatory compliance, financial health, and security risks. Integrates with global databases to flag liabilities before contracts are signed.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'from-red-500 to-rose-600' },
  { title: 'Financial Forecaster', desc: 'Predict litigation costs, settlement probabilities, and optimize your legal spend. Uses historical precedent and machine learning to map out multi-year financial exposure models.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'from-emerald-400 to-teal-500' },
  { title: 'Privilege Sentinel', desc: 'Secure, encrypted client portals that replace vulnerable email chains. Features end-to-end encryption, ephemeral messaging, and verified identity checks for sensitive document exchange.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'from-cyan-500 to-blue-500' },
  { title: 'AI Privacy Redactor', desc: 'Automatically scan documents for PII (SSN, credit cards, salaries) and securely black them out with one click before external sharing.', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', color: 'from-yellow-400 to-orange-500' },
  { title: 'Forensic AI', desc: 'Detect anomalies in billing, metadata irregularities, and backdated signatures using advanced behavioral machine learning. Stop internal and external fraud before it occurs.', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: 'from-orange-500 to-amber-500' },
  { title: 'Knowledge Graph', desc: 'Visualize complex corporate structures, entity relationships, and beneficial ownership chains. Instantly untangle multi-layered subsidiaries across international jurisdictions.', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', color: 'from-indigo-500 to-purple-600' },
  { title: 'AI Contract Drafting', desc: 'Draft bespoke legal documents in seconds from natural language prompts. Trained strictly on your firm\'s proprietary templates to ensure absolute stylistic and legal consistency.', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'from-pink-500 to-rose-500' },
  { title: 'Compliance Oracle', desc: 'Real-time mapping of your entire document repository against constantly shifting global regulatory frameworks (GDPR, CCPA, SOC2). Instantly flags compliance gaps.', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', color: 'from-teal-500 to-emerald-600' },
];

const Features = () => {
  const { pathname } = useLocation();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleNext = () => setActiveIdx((prev) => (prev + 1) % allFeatures.length);
  const handlePrev = () => setActiveIdx((prev) => (prev - 1 + allFeatures.length) % allFeatures.length);

  return (
    <div className="min-h-screen bg-[#080c18] text-white font-sans overflow-x-hidden relative">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.15)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            The Complete Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-normal mb-8">
            12 specialized tools.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">One unified command center.</span>
          </h1>
        </div>
      </div>

      {/* Interactive Feature Carousel */}
      <div className="pb-20 relative z-10 flex flex-col items-center">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          Click side cards to view feature details
        </p>
        
        <div className="relative w-full h-[450px] flex justify-center items-center perspective-[1000px] mb-12">
          {allFeatures.map((feat, i) => {
            const len = allFeatures.length;
            let position = 'hidden'; 
            if (i === activeIdx) position = 'center';
            else if (i === (activeIdx - 1 + len) % len) position = 'left';
            else if (i === (activeIdx + 1) % len) position = 'right';
            else if (i === (activeIdx - 2 + len) % len) position = 'farLeft';
            else if (i === (activeIdx + 2) % len) position = 'farRight';

            const isCenter = position === 'center';
            const isLeft = position === 'left';
            const isRight = position === 'right';
            const isFarLeft = position === 'farLeft';
            const isFarRight = position === 'farRight';
            const isEdge = isFarLeft || isFarRight;

            // Determine precise 3D transforms and dynamic widths
            let transformStyle = { transform: 'scale(0.5) translateY(50px)', opacity: 0, zIndex: 0 };
            let cursor = 'default';
            let cardWidth = '260px'; 

            if (isCenter) {
               transformStyle = { transform: 'translateX(0) translateZ(100px) scale(1)', opacity: 1, zIndex: 30 };
               cardWidth = '350px'; 
            } else if (isLeft) {
               transformStyle = { transform: 'translateX(-130%) translateZ(-50px) scale(0.9) rotateY(15deg)', opacity: 0.9, zIndex: 20 };
               cursor = 'pointer';
            } else if (isRight) {
               transformStyle = { transform: 'translateX(130%) translateZ(-50px) scale(0.9) rotateY(-15deg)', opacity: 0.9, zIndex: 20 };
               cursor = 'pointer';
            } else if (isFarLeft) {
               transformStyle = { transform: 'translateX(-240%) translateZ(-200px) scale(0.75) rotateY(25deg)', opacity: 0.7, zIndex: 10 };
            } else if (isFarRight) {
               transformStyle = { transform: 'translateX(240%) translateZ(-200px) scale(0.75) rotateY(-25deg)', opacity: 0.7, zIndex: 10 };
            }

            return (
              <div 
                key={i}
                onClick={() => {
                  if (isLeft) handlePrev();
                  if (isRight) handleNext();
                }}
                className="absolute transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ ...transformStyle, transformStyle: 'preserve-3d', cursor, width: cardWidth }}
              >
                <div 
                  className={`w-full relative overflow-hidden backdrop-blur-xl rounded-3xl p-8 flex flex-col justify-start border ${isCenter ? 'bg-[#080c18] border-indigo-500/60 shadow-[0_0_80px_rgba(99,102,241,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] h-[400px]' : isEdge ? 'bg-[#080c18] border-white/10 h-[280px]' : 'bg-[#080c18] border-white/10 h-[320px]'} transition-all duration-700`}
                >
                  
                  {/* Content (Hidden on Far Left/Right edge cards) */}
                  <div className={`transition-all duration-700 h-full flex flex-col relative z-10 ${isEdge ? 'opacity-0' : 'opacity-100'}`}>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-700 mb-6 mx-auto ${isCenter ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'scale-90'}`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feat.icon} />
                      </svg>
                    </div>
                    
                    {/* Text */}
                    <div className="transition-all duration-700 flex-1 text-center flex flex-col justify-center">
                      <h3 className={`font-bold text-white mb-3 ${isCenter ? 'text-2xl' : 'text-xl'}`}>{feat.title}</h3>
                      
                      {/* Description only shows if it's the center card */}
                      <div className={`overflow-hidden transition-all duration-700 ${isCenter ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                         <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Labels */}
        <div className="flex flex-wrap justify-center gap-3 max-w-5xl z-20 relative px-6">
          {allFeatures.map((feat, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-300 border backdrop-blur-md ${
                activeIdx === i 
                  ? 'bg-indigo-600/20 text-white border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                  : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {feat.title}
            </button>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-16 text-center">
          <p className="text-xl text-gray-400 font-medium leading-relaxed">
            CogniVault isn't just a search engine. It's an entire suite of AI agents trained specifically for enterprise legal and compliance workflows.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="py-32 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Ready to deploy the full suite?</h2>
          <Link to="/pricing" className="px-10 py-5 bg-white text-black font-extrabold rounded-xl hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] inline-flex items-center gap-2">
            View Pricing
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Features;
