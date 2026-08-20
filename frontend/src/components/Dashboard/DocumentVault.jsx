import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const DocumentVault = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState([]);  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');

  const fetchDocuments = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
      if (!user.id) return navigate('/');
      const res = await axios.get(`${NODE_URL}/api/documents?userId=${user.id}`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents', err);
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
      await axios.delete(`${NODE_URL}/api/documents/${id}`, {
        data: { userId: user.id }
      });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting document');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      setMessage('Error: File exceeds the maximum allowed size of 50MB.');
      setFile(null);
      return;
    }

    setUploading(true);
    setMessage('');
    
    const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
    if (!user.id) return navigate('/');
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('userId', user.id); 

    try {
      const res = await axios.post(`${NODE_URL}/api/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('File uploaded securely to Vault! Awaiting Python AI Analysis.');
      setFile(null);
      fetchDocuments(); // Refresh the list
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error uploading file. Is the Node.js server running?');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] flex font-sans select-none">
      {/* Sidebar */}
      <Sidebar currentTier={1} />
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30 flex items-center justify-center shadow-lg">
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  </div>
  <h1 className="text-xl font-bold text-gray-800 tracking-tight">Intelligence Vault</h1>
</div>
          
          <div className="flex-1 flex justify-end items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
             <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">{(user?.workspace?.name || 'W').charAt(0).toUpperCase()}</div>
             <span className="text-sm font-bold text-gray-700">{user?.workspace?.name || 'Workspace'}</span>
           </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-8">
          <div className="mb-8">
            
            <p className="text-gray-500 mt-2">Upload your legal contracts (PDF/CSV). Our AI will instantly classify and extract key clauses.</p>
          </div>

          {/* Drag & Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${file ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.csv,.docx,.txt"
              disabled={JSON.parse(sessionStorage.getItem('cognivault_user') || '{}').tier === 'free_trial' && documents.length >= 1}
            />
            
            <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
               </svg>
            </div>

            {file ? (
              <div>
                <h3 className="text-xl font-bold text-gray-900">{file.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="mt-6 flex justify-center gap-4">
                  <button 
                    onClick={() => setFile(null)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={uploadFile}
                    disabled={uploading}
                    className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? 'Encrypting & Uploading...' : 'Upload to Vault'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-900">Drag and drop your file here</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">Supports PDF, DOCX, and CSV up to 50MB</p>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  disabled={JSON.parse(sessionStorage.getItem('cognivault_user') || '{}').tier === 'free_trial' && documents.length >= 1}
                  className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {JSON.parse(sessionStorage.getItem('cognivault_user') || '{}').tier === 'free_trial' && documents.length >= 1 ? 'Free Trial Limit Reached' : 'Browse Files'}
                </button>
              </div>
            )}
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg font-medium text-sm flex items-center gap-3 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}

          {/* Uploaded Documents List */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Vault Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-200">No documents in your vault yet. Upload a PDF above to get started!</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-700">
                      <th className="px-6 py-4">Filename</th>
                      <th className="px-6 py-4">Uploaded</th>
                      {JSON.parse(sessionStorage.getItem('cognivault_user') || '{}').role === 'manager' && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="font-medium text-gray-900 text-sm">{doc.originalName}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                        </td>
                        {JSON.parse(sessionStorage.getItem('cognivault_user') || '{}').role === 'manager' && (
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteDocument(doc._id)}
                              className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>



        </main>
      </div>
    </div>
  );
};

export default DocumentVault;
