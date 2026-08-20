import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';
import Navbar from './Navbar';

const Pricing = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  const primaryTiers = [
    {
      name: 'Basic',
      price: { 
        monthly: { usd: '$99', inr: '₹7,999' }, 
        halfYearly: { usd: '$94', inr: '₹7,599' }, 
        yearly: { usd: '$89', originalUsd: '$99', inr: '₹7,199', originalInr: '₹7,999' } 
      },
      desc: 'The AI document foundation for growing teams.',
      features: ['Executive Summary (Auto-Brief)', 'AI Document Classification', 'Semantic Search (RAG)', 'Automated Redlining', '256-bit AES Encryption'],
      cta: 'Start Basic',
      highlighted: false,
    },
    {
      name: 'Moderate',
      price: { 
        monthly: { usd: '$309', inr: '₹25,999' }, 
        halfYearly: { usd: '$304', inr: '₹25,499' }, 
        yearly: { usd: '$299', originalUsd: '$309', inr: '₹24,999', originalInr: '₹25,999' } 
      },
      desc: 'Predictive intelligence for risk-aware enterprises.',
      features: ['Everything in Basic', 'Vendor Risk Screening', 'Financial Forecaster', 'Privilege Sentinel', 'AI Privacy Redactor'],
      cta: 'Start Moderate',
    },
    {
      name: 'Advanced',
      price: { 
        monthly: { usd: '$499', inr: '₹41,999' }, 
        halfYearly: { usd: '$489', inr: '₹40,999' }, 
        yearly: { usd: '$479', originalUsd: '$499', inr: '₹39,999', originalInr: '₹41,999' } 
      },
      desc: 'The full enterprise AI engine for total intelligence.',
      features: ['Everything in Moderate', 'Financial Forensic AI', 'Global Knowledge Graph', 'Generative Contract Drafting', 'Live Compliance Oracle'],
      cta: 'Start Advanced',
      highlighted: false,
    }
  ];



  const faqs = [
    { q: "Can we self-host CogniVault?", a: "Yes. Self-hosting on your private AWS, GCP, or Azure infrastructure is available exclusively on the Custom Enterprise tier." },
    { q: "What happens if we exceed our usage?", a: "We never hard-cap your access or interrupt your workflow. If you exceed your analysis limits, your account manager will reach out to discuss upgrading your tier." },
    { q: "Is my data used to train your models?", a: "Absolutely not. We maintain a strict zero-retention and zero-training policy for all user data across all tiers." }
  ];



  return (
    <div className="min-h-screen bg-[#080c18] text-white font-sans overflow-x-hidden pb-32">
      <Navbar />
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-15%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
        <ParticleBackground />
      </div>

      <div className="relative max-w-[85rem] mx-auto px-6 pt-32 z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-5xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.15)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Predictable Scaling
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-normal leading-[1.1] text-white mb-8">
            Pricing that scales. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Intelligence that evolves.</span>
          </h1>
          <p className="text-lg text-gray-400 font-medium">
            Choose the perfect intelligence tier for your firm. Scale up as your data grows.
          </p>
        </div>

        {/* PRICING TOGGLE */}
        <div className="flex justify-center mb-16">
          {/* Billing Cycle Toggle */}
          <div className="bg-[#0b101d]/80 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/5 relative shadow-xl">
            {['monthly', 'halfYearly', 'yearly'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-3 text-sm font-bold rounded-xl transition-all duration-300 z-10 ${
                  activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {activeTab === tab && (
                  <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] -z-10" />
                )}
                {tab === 'monthly' ? 'Monthly' : tab === 'halfYearly' ? '6 Months' : 'Annual'}
                {tab === 'yearly' && (
                  <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-wider rounded-md font-black shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    Save 10%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3-COLUMN PRIMARY TIERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {primaryTiers.map((tier) => (
            <div
              key={tier.name}
              className="relative flex flex-col px-6 py-8 lg:px-8 lg:py-10 rounded-[2.5rem] transition-all duration-700 hover:-translate-y-2 bg-[#0a0f1d]/60 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-[#0a0f1d]/90 hover:border-indigo-400/60 hover:shadow-[0_0_60px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] group"
            >
              <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700" style={{
                background: 'linear-gradient(180deg, rgba(99,102,241,0.15) 0%, transparent 100%)'
              }} />
              
              <div className="mb-8 relative z-10">
                <h3 className="text-2xl font-black text-white mb-2">{tier.name}</h3>
                <div className="flex flex-col mb-4 mt-4">
                  <div className="flex items-baseline flex-nowrap whitespace-nowrap gap-x-2 gap-y-1">
                    <span className="text-4xl lg:text-[2.75rem] leading-none font-black text-white">{tier.price[activeTab].inr}</span>
                    {tier.price[activeTab].originalInr && (
                      <span className="text-sm lg:text-base font-bold text-gray-500 line-through">{tier.price[activeTab].originalInr}</span>
                    )}
                    <span className="text-gray-400 text-sm font-bold">/month</span>
                  </div>
                  <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mt-1">
                    <span className="text-lg font-bold text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{tier.price[activeTab].usd}</span>
                    {tier.price[activeTab].originalUsd && (
                      <span className="text-xs font-bold text-gray-600/70 line-through">{tier.price[activeTab].originalUsd}</span>
                    )}
                    <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">/month (USD)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{tier.desc}</p>
              </div>

              <ul className="space-y-5 mb-10 flex-1 relative z-10">
                {tier.features.map((feat, i) => (
                   <li key={i} className="flex items-start gap-4 text-sm text-gray-300 font-medium">
                    <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-400/70 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors duration-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link to={`/checkout?plan=${tier.name.toLowerCase()}&billing=${activeTab}`} className="relative z-10 w-full py-4 rounded-xl font-bold text-sm text-center transition-all duration-500 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 group-hover:bg-white group-hover:text-black group-hover:border-transparent group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* HORIZONTAL ENTERPRISE TIER */}
        <div className="relative flex flex-col md:flex-row items-center justify-between p-10 md:p-12 rounded-[2.5rem] transition-all duration-700 bg-[#050914]/80 backdrop-blur-2xl border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/10 mb-32 overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10 flex-1 mb-8 md:mb-0 md:pr-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-4">
              Custom Build
            </div>
            <h3 className="text-3xl font-black text-white mb-2">Enterprise</h3>
            <p className="text-gray-400 font-medium text-lg max-w-xl">
              Bespoke infrastructure for Fortune 500 corporations requiring dedicated compute, self-hosting, and SLA guarantees.
            </p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto flex flex-col md:items-end gap-6 shrink-0">
            <ul className="space-y-3">
              {['Dedicated Single-Tenant Instance', 'On-Prem / Private Cloud Deployment', 'White-glove Onboarding & Training', 'Custom AI Model Fine-Tuning'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-medium justify-start md:justify-end">
                  <span className="order-2 md:order-1">{feat}</span>
                  <svg className="w-4 h-4 text-amber-400 order-1 md:order-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </li>
              ))}
            </ul>
            <Link to="/enterprise-contact" className="px-10 py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 text-center w-full md:w-auto">
              Contact Sales
            </Link>
          </div>
        </div>



        {/* FAQ SECTION */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 font-medium">Everything you need to know about purchasing and scaling.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#050914]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-8 py-6 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-white pr-8">{faq.q}</span>
                  <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 shrink-0 ${openFaq === i ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
