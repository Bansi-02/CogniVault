import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Landing/Navbar';
import ParticleBackground from '../Landing/ParticleBackground';
import Footer from '../Landing/Footer';

const PrivacyPolicy = () => {
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

        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: July 8, 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-gray-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              At CogniVault, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application and use our enterprise legal services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Data Security & AI Processing</h2>
            <p className="mb-4">
              CogniVault is built on a Zero-Trust architecture. When you upload contracts or financial documents to the vault:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Documents are encrypted at rest using 256-bit AES encryption.</li>
              <li>Data processed by our AI models (including Google Gemini) is processed securely and is <strong>not</strong> used to train public foundational models.</li>
              <li>You retain full ownership of all data uploaded to the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect includes personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
              <br />
              <a href="mailto:cognivault.15@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-medium">cognivault.15@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
