import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import Navbar from '../Landing/Navbar';
import ParticleBackground from '../Landing/ParticleBackground';
import Footer from '../Landing/Footer';

const SupportPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch(`${PYTHON_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c18] text-white font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-15%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]" />
        <ParticleBackground />
      </div>

      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10 flex-1 w-full flex flex-col justify-center items-center">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
            Enterprise Support
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">How can we help?</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our legal engineering team is ready to assist you with custom deployments, enterprise licensing, or technical queries.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 w-full">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-3 bg-[#050914]/80 backdrop-blur-2xl border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-8">Submit a Ticket</h2>
              
              {status === 'success' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Message Received!</h3>
                  <p className="text-gray-400">A confirmation email has been sent to your inbox. Our team will review your query and respond shortly.</p>
                  <button onClick={() => setStatus('idle')} className="mt-6 text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                    Submit another query &rarr;
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" 
                        placeholder="john@company.com" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">How can we help?</label>
                    <textarea 
                      required 
                      rows="5" 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-black/40 border border-gray-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" 
                      placeholder="Describe your enterprise requirements or technical issue..."
                    ></textarea>
                  </div>
                  
                  {status === 'error' && (
                    <div className="text-red-400 text-sm font-semibold bg-red-500/10 p-3 rounded-lg">
                      Failed to submit query. Please try again or email us directly.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Transmitting...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
          
          {/* Right Column: Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#050914]/80 backdrop-blur-2xl border border-white/5 p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.6)] group hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Technical Support</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">Having trouble with API integration or document processing? Our engineers are available 24/7.</p>
              <a href="mailto:cognivault.15@gmail.com" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300">
                cognivault.15@gmail.com
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>

            <div className="bg-[#050914]/80 backdrop-blur-2xl border border-white/5 p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.6)] group hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Enterprise Sales</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">Request a live demo, discuss custom LLM fine-tuning, or get volume pricing.</p>
              <a href="mailto:cognivault.15@gmail.com" className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300">
                cognivault.15@gmail.com
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SupportPage;
