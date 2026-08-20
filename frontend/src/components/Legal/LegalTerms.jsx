import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Landing/Navbar';
import ParticleBackground from '../Landing/ParticleBackground';
import Footer from '../Landing/Footer';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080c18] text-white font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-15%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]" />
        <ParticleBackground />
      </div>

      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-10 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: July 8, 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-gray-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p>
              By viewing or using this application, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on CogniVault's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials;</li>
              <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>Attempt to decompile or reverse engineer any software contained on CogniVault's website;</li>
              <li>Remove any copyright or other proprietary notations from the materials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer (Demo Purpose)</h2>
            <p>
              The materials on CogniVault's website are provided on an 'as is' basis. CogniVault makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Note that this platform is deployed for demonstration purposes.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
