import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const categoryColors = {
  'NDA': 'bg-purple-50 text-purple-700 border-purple-100',
  'Service Agreement': 'bg-blue-50 text-blue-700 border-blue-100',
  'Employment Contract': 'bg-green-50 text-green-700 border-green-100',
  'Lease Agreement': 'bg-orange-50 text-orange-700 border-orange-100',
  'Purchase Order': 'bg-teal-50 text-teal-700 border-teal-100',
  'Invoice': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Financial Report': 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const getColor = (cls) => categoryColors[cls] || 'bg-indigo-50 text-indigo-700 border-indigo-100';

const AIClassification = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
        const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const categories = ['all', ...new Set(documents.map(d => d.classification).filter(Boolean))];
  const filtered = filter === 'all' ? documents : documents.filter(d => d.classification === filter);

  const classified = documents.filter(d => d.status === 'classified').length;
  const pending = documents.filter(d => d.status === 'uploaded').length;
  const errors = documents.filter(d => d.status === 'error').length;
  const avgConfidence = documents.filter(d => d.confidence).length
    ? (documents.filter(d => d.confidence).reduce((s, d) => s + d.confidence, 0) / documents.filter(d => d.confidence).length).toFixed(0)
    : 0;

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      <Sidebar currentTier={1} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Classification</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Documents', value: documents.length, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-200' },
              { label: 'Classified', value: classified, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Pending', value: pending, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
              { label: 'Avg Confidence', value: `${avgConfidence}%`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${s.bg}`}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    filter === cat
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <svg className="w-7 h-7 animate-spin mr-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Loading documents...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-semibold">No documents found. Upload a PDF in the Intelligence Vault to classify it.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(doc => (
                    <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{doc.originalName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.classification ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getColor(doc.classification)}`}>
                            {doc.classification}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Awaiting analysis...</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {doc.confidence ? (
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${doc.confidence >= 85 ? 'bg-emerald-500' : doc.confidence >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${doc.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-extrabold text-gray-700">{doc.confidence.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          doc.status === 'classified' ? 'bg-emerald-100 text-emerald-700' :
                          doc.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIClassification;
