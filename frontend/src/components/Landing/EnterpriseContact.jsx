import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import ParticleBackground from './ParticleBackground';
import Footer from './Footer';

const EnterpriseContact = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    company: '',
    employees: '',
    budget: '',
    needs: '' 
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    const formattedMessage = `[ENTERPRISE LEAD]
Company: ${formData.company}
Employees: ${formData.employees}
Budget: ${formData.budget}

Requirements:
${formData.needs}`;

    try {
      const res = await fetch(`${PYTHON_URL}/api/enterprise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formattedMessage
        })
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', company: '', employees: '', budget: '', needs: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[1000px] h-[1000px] bg-indigo-900/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[150px]" />
        <ParticleBackground />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 flex-1 w-full flex flex-col justify-center">
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-12 group self-start"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Value Proposition */}
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest">
              CogniVault Enterprise
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Scale Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">
                Legal Intelligence.
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 leading-relaxed font-medium">
              Bespoke infrastructure tailored for Fortune 500 corporations. Talk to our architects about dedicated compute, private cloud deployments, and custom AI model fine-tuning.
            </p>

            <div className="pt-8 border-t border-white/10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Bank-Grade Security</h3>
                  <p className="text-sm text-gray-400">Zero-trust architecture with complete data isolation.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Custom Fine-Tuning</h3>
                  <p className="text-sm text-gray-400">Models trained specifically on your legal playbooks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="lg:col-span-7 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-cyan-500/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            
            <div className="relative bg-[#050914]/90 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]">
              {status === 'success' ? (
                <div className="py-12 text-center animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Request Received</h3>
                  <p className="text-gray-400 text-lg mb-8 max-w-sm mx-auto">
                    We've sent a confirmation email to your inbox. An enterprise architect will review your requirements and reach out within 24 hours.
                  </p>
                  <button onClick={() => setStatus('idle')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-sm">
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Work Email</label>
                      <input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600" 
                        placeholder="john@company.com" 
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Company</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600" 
                        placeholder="Acme Corp" 
                      />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Employees</label>
                      <select 
                        required
                        value={formData.employees}
                        onChange={(e) => setFormData({...formData, employees: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                      >
                        <option value="" disabled className="bg-[#050914]">Select size...</option>
                        <option value="1-50" className="bg-[#050914]">1 - 50</option>
                        <option value="51-200" className="bg-[#050914]">51 - 200</option>
                        <option value="201-1000" className="bg-[#050914]">201 - 1000</option>
                        <option value="1000+" className="bg-[#050914]">1000+</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Budget</label>
                      <select 
                        required
                        value={formData.budget}
                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                      >
                        <option value="" disabled className="bg-[#050914]">Select budget...</option>
                        <option value="< ₹10,00,000" className="bg-[#050914]">&lt; ₹10L</option>
                        <option value="₹10,00,000 - ₹50,00,000" className="bg-[#050914]">₹10L - ₹50L</option>
                        <option value="₹50,00,000+" className="bg-[#050914]">₹50L+</option>
                        <option value="To be discussed" className="bg-[#050914]">TBD</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Project Requirements</label>
                    <textarea 
                      required 
                      rows="4" 
                      value={formData.needs}
                      onChange={(e) => setFormData({...formData, needs: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none placeholder:text-gray-600" 
                      placeholder="e.g. We require on-premise deployment and custom AI model fine-tuning..."
                    ></textarea>
                  </div>
                  
                  {status === 'error' && (
                    <div className="text-red-400 text-sm font-semibold bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Failed to submit inquiry. Please try again or email us directly.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="group w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] hover:-translate-y-1"
                  >
                    <span className="flex items-center gap-2">
                      {status === 'loading' ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit Inquiry
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EnterpriseContact;
