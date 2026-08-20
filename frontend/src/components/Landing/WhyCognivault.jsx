import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import ParticleBackground from './ParticleBackground';
import { NODE_URL } from '../../config/api';
import axios from 'axios';

const AdBanner = ({ ad, position, onClose }) => {
  return (
    <div className={`fixed bottom-10 ${position === 'left' ? 'left-10 slide-in-from-left-8' : 'right-10 slide-in-from-right-8'} z-50 animate-in duration-1000 w-[320px] h-auto max-h-[80vh] bg-white border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
      <div className="flex justify-between items-center px-3 py-1.5 bg-[#0B0F19] border-b border-white/10 z-10 shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold truncate pr-2">Sponsored: {ad.company}</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors shrink-0">✕</button>
      </div>
      <div className="w-full cursor-pointer p-0 flex items-center justify-center bg-white overflow-hidden">
        <img src={`${NODE_URL}/${ad.bannerPath}`} alt={`${ad.company} advertisement`} className="w-full h-auto object-contain" />
      </div>
    </div>
  );
};

const WhyCognivault = () => {
  const [fetchedAds, setFetchedAds] = useState([]);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [closedAds, setClosedAds] = useState(() => {
    // Keep track of ads the user has closed this session
    try {
      return JSON.parse(sessionStorage.getItem('closed_ads')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await axios.get(`${NODE_URL}/api/advertisements/active`);
        if (res.data && res.data.length > 0) {
          setFetchedAds(res.data);
        }
      } catch (err) {
        console.error("Error fetching active ads", err);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (fetchedAds.length > 0) {
      const leftTimer = setTimeout(() => setShowLeft(true), 10000); // 10 seconds
      const rightTimer = setTimeout(() => setShowRight(true), 20000); // 20 seconds
      return () => {
        clearTimeout(leftTimer);
        clearTimeout(rightTimer);
      };
    }
  }, [fetchedAds]);

  const handleCloseAd = (adId) => {
    const newClosed = [...closedAds, adId];
    setClosedAds(newClosed);
    sessionStorage.setItem('closed_ads', JSON.stringify(newClosed));
  };

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '< 2s', label: 'AI Response Time' },
    { value: '256-bit', label: 'AES Encryption' },
    { value: '50MB', label: 'Max File Size' },
  ];

  const reviews = [
    {
      name: "Eleanor Sterling",
      title: "Managing Partner, Sterling & Associates",
      quote: "CogniVault's Financial Forecaster completely changed our due diligence process. We caught a hidden $2M liability in a vendor contract within 45 seconds.",
      rating: 5,
      avatar: "ES"
    },
    {
      name: "Marcus Thorne",
      title: "Chief Compliance Officer, Horizon Finance",
      quote: "The Semantic Search is unparalleled. Finding specific indemnification clauses across 400+ legacy contracts used to take weeks. Now it takes asking a simple question.",
      rating: 5,
      avatar: "MT"
    },
    {
      name: "Sarah Jenkins",
      title: "General Counsel, Nexus Tech",
      quote: "Finally, a platform that understands enterprise scale. The vendor risk screening API saves my team thousands of hours a quarter. Absolutely essential.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "David Chen",
      title: "Head of Legal Ops, Vanguard Logistics",
      quote: "The Forensic AI module is ruthless. It flagged three anomalies in our invoicing history that our previous audit firm entirely missed.",
      rating: 5,
      avatar: "DC"
    },
    {
      name: "Elena Rodriguez",
      title: "Partner, Corporate M&A, Davis & Co",
      quote: "We require all our portfolio companies to migrate to CogniVault. The AI Classification engine organizes messy data rooms with terrifying accuracy.",
      rating: 5,
      avatar: "ER"
    },
    {
      name: "Jonathan Vance",
      title: "Director of Risk, Global Enterprises",
      quote: "CogniVault is the first AI tool I actually trust with our highly sensitive corporate IP. The military-grade encryption and access controls are flawless.",
      rating: 5,
      avatar: "JV"
    }
  ];

  return (
    <div className="min-h-screen bg-[#080c18] text-white font-sans overflow-x-hidden relative">
      {/* ── LIVE ADS RENDERER ── */}
      {showLeft && fetchedAds[0] && !closedAds.includes(fetchedAds[0]._id) && (
        <AdBanner 
          ad={fetchedAds[0]} 
          position="left" 
          onClose={() => handleCloseAd(fetchedAds[0]._id)} 
        />
      )}
      {showRight && fetchedAds[1] && !closedAds.includes(fetchedAds[1]._id) && (
        <AdBanner 
          ad={fetchedAds[1]} 
          position="right" 
          onClose={() => handleCloseAd(fetchedAds[1]._id)} 
        />
      )}

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-15%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <ParticleBackground />
      </div>

      <Navbar />

      {/* ── HERO SECTION ── */}
      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-16 z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.15)] mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Enterprise Intelligence Redefined
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-normal leading-[1.1] text-white mb-8">
          Don't just store documents.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Interrogate them.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Legacy document management systems are digital filing cabinets. CogniVault is an autonomous legal and financial analyst working for you 24/7.
        </p>
      </div>

      {/* ── STATS BAR ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-y border-white/10 bg-white/[0.02] backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center px-4">
              <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CORE ADVANTAGES ── */}
      <div className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">The CogniVault Advantage</h2>
            <p className="text-gray-400 font-medium text-lg">Why Fortune 500s choose us over legacy document management systems.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* CARD 1: ROI */}
            <div className="group relative bg-[#0B0F19]/80 backdrop-blur-xl border border-white/5 hover:border-rose-500/30 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(244,63,94,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-500">
                  <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-rose-50 transition-colors">10x ROI on Legal Spend</h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">By automating routine contract drafting, vendor screening, and compliance checks, enterprise legal departments can redirect millions in billable hours toward strategic growth.</p>
              </div>
            </div>

            {/* CARD 2: PROACTIVE */}
            <div className="group relative bg-[#0B0F19]/80 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500">
                  <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-amber-50 transition-colors">Continuous Proactive Compliance</h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">Don't wait for an audit. Our platform constantly monitors your document ecosystem, flags high-risk clauses, and quarantines anomalous behaviors before they become liabilities.</p>
              </div>
            </div>

            {/* CARD 3: SCALABILITY */}
            <div className="group relative bg-[#0B0F19]/80 backdrop-blur-xl border border-white/5 hover:border-fuchsia-500/30 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(217,70,239,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center mb-6 border border-fuchsia-500/20 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all duration-500">
                  <svg className="w-7 h-7 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-fuchsia-50 transition-colors">Enterprise-Grade Scalability</h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">Built on a dual-backend architecture, CogniVault effortlessly handles millions of documents. Our microservices ensure that heavy AI processing never slows down your operations.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS (WALL OF LOVE) ── */}
      <div className="py-24 relative z-10 bg-black/40 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">Trusted by Legal Leaders</h2>
            <p className="text-gray-400 font-medium text-lg">Don't just take our word for it. Here's what our enterprise partners have to say.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-[#0B0F19] border border-white/10 rounded-3xl p-8 hover:border-indigo-500/50 transition-colors flex flex-col">
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-300 font-medium leading-relaxed mb-8 flex-1 italic">"{review.quote}"</p>
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/10">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{review.name}</h4>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{review.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CALL TO ACTION ── */}
      <div className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-8">Ready to upgrade your intelligence?</h2>
          <p className="text-xl text-gray-400 font-medium mb-12 max-w-2xl mx-auto">
            Join the most advanced legal and financial risk management platform on the market.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pricing" className="px-8 py-4 bg-white text-[#080c18] text-lg font-black rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              View Pricing & Plans
            </Link>
            <Link to="/partnerships" className="px-8 py-4 bg-transparent text-white border-2 border-white/20 text-lg font-bold rounded-2xl hover:bg-white/5 transition-colors">
              Explore Partnerships
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WhyCognivault;
