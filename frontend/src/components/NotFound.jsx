import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
      <div className="text-center px-6">
        {/* Glowing 404 number */}
        <div className="relative inline-block mb-6">
          <span
            className="text-[120px] font-black tracking-tighter leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.3))',
            }}
          >
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-gray-500 text-[15px] mb-8 max-w-sm mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
