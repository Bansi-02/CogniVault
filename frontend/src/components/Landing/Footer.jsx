import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);

  return (
    <>
    <footer className="border-t border-white/10 bg-[#020617] pt-16 pb-8 mt-auto w-full relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.jpg" alt="CogniVault Logo" className="h-10 w-auto rounded-lg border border-white/10" />
              <span className="text-xl font-black text-white tracking-tight">CogniVault</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Enterprise AI command center for legal, financial, and operational intelligence. Deployed on secure, zero-trust infrastructure.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
              <li><Link to="/why-cognivault" className="text-gray-400 hover:text-white text-sm transition-colors">Why CogniVault</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/partnerships" className="text-gray-400 hover:text-white text-sm transition-colors">Partnerships</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CogniVault Inc. All rights reserved. (Demo Deployment)
          </p>
          <div className="flex gap-4">
            <button onClick={() => setShowLinkedInModal(true)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </footer>

    {showLinkedInModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowLinkedInModal(false)}>
        <div className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowLinkedInModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-black/50 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src="/linkedin-mock.jpg" alt="LinkedIn Page" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" />
        </div>
      </div>
    )}
    </>
  );
};

export default Footer;
