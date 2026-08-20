import { NODE_URL, PYTHON_URL } from '../../config/api';
import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const KnowledgeGraph = () => {  const [query, setQuery] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [viewMode, setViewMode] = useState('graph');
  
  const fgRef = useRef();

  const handleSearch = async (e, searchQuery = query) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${PYTHON_URL}/api/graph/explore`, {
        params: { q: searchQuery }
      });
      
      if (res.data.nodes.length === 0) {
        setError(`No knowledge graph found for "${searchQuery}".`);
        setGraphData({ nodes: [], links: [] });
        setSelectedNode(null);
      } else {
        setGraphData(res.data);
        setSelectedNode(res.data.nodes.find(n => n.id === res.data.nodes[0].id));
      }
    } catch (err) {
      setError('Could not connect to the Knowledge Graph engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = async (node) => {
    // Set a loading state in the modal immediately
    setSelectedNode({ ...node, desc: 'Fetching intelligence record...' });
    
    try {
      const res = await axios.get(`${PYTHON_URL}/api/graph/explore`, {
        params: { q: node.name }
      });
      if (res.data.nodes.length > 0 && res.data.nodes[0].desc) {
        setSelectedNode({ ...node, desc: res.data.nodes[0].desc });
      } else {
        setSelectedNode({ ...node, desc: "No detailed intelligence record available for this entity." });
      }
    } catch (err) {
      setSelectedNode({ ...node, desc: "Failed to fetch entity record." });
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 flex font-sans select-none text-gray-900">
      <Sidebar currentTier={3} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center px-10 shrink-0 gap-6 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight whitespace-nowrap">Knowledge Graph</h1>
          </div>

          <div className="flex-1 flex justify-end gap-4 items-center">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('graph')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'graph' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Graph View
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Table View
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search entity (e.g. OpenAI)..."
                className="w-64 pl-4 pr-16 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" disabled={loading} className="absolute right-1.5 top-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">Build</button>
            </form>
          </div>
        </header>
        {/* Graph & Panel Container */}
        <div className="flex-1 flex w-full h-full bg-slate-50 relative overflow-hidden">
          

          {/* Graph Canvas */}
          <div className="flex-1 relative">
            {error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold shadow-lg border border-red-200">
                  {error}
                </div>
              </div>
            )}
            
            {graphData.nodes.length === 0 && !loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
                <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                <p className="font-bold text-xl text-gray-700">Enter an entity to build the graph</p>
                <p className="text-sm mt-2 max-w-md text-center text-gray-500">
                  The AI will dynamically map relationships, subsidiaries, and key associations using live semantic extraction.
                </p>
              </div>
            )}

            {graphData.nodes.length > 0 && viewMode === 'graph' && (
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel={node => `<div style="background: white; padding: 6px 10px; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: bold; pointer-events: none;">${node.name}</div>`}
                nodeColor={node => {
                  const isHovered = hoverNode === node;
                  const isNeighbor = hoverNode && graphData.links.some(l => 
                    (l.source.id === node.id && l.target.id === hoverNode.id) ||
                    (l.target.id === node.id && l.source.id === hoverNode.id)
                  );
                  
                  // Dim nodes that are not hovered or neighbors if something is hovered
                  if (hoverNode && !isHovered && !isNeighbor) return 'rgba(148, 163, 184, 0.2)'; // Faded slate

                  // Formal corporate palette
                  if (node.id === graphData.nodes[0].id) return '#4f46e5'; // Indigo for root
                  return '#64748b'; // Slate for children
                }}
                nodeVal={node => node.val * 0.3} // Drastically decrease base volume
                nodeRelSize={1.5} // Small, crisp node sizes
                linkColor={link => {
                  if (hoverNode) {
                    const isLinkHovered = link.source.id === hoverNode.id || link.target.id === hoverNode.id;
                    return isLinkHovered ? 'rgba(79, 70, 229, 0.6)' : 'rgba(148, 163, 184, 0.1)';
                  }
                  return 'rgba(148, 163, 184, 0.3)'; // Solid grey line
                }}
                linkWidth={link => {
                  if (hoverNode) {
                    return (link.source.id === hoverNode.id || link.target.id === hoverNode.id) ? 2 : 0.5;
                  }
                  return 1;
                }}
                onNodeHover={node => setHoverNode(node)}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => {
                  if (fgRef.current) fgRef.current.zoomToFit(400, 50);
                }}
              />
            )}

            {graphData.nodes.length > 0 && viewMode === 'table' && (
              <div className="absolute inset-0 bg-white overflow-auto p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-gray-900">Extracted Entities</h2>
                    <p className="text-sm text-gray-500 font-medium">Tabular view of all entities extracted from the Knowledge Graph</p>
                  </div>
                  
                  {/* Inline Details Panel (Scrolls naturally, not sticky) */}
                  {selectedNode && selectedNode.desc && (
                    <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                           </div>
                           <div>
                              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedNode.name}</h3>
                              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-1">Entity Intelligence Record</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedNode.desc}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entity Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Relevance Score</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {graphData.nodes.sort((a, b) => b.val - a.val).map((node, idx) => (
                          <tr key={node.id} className={`hover:bg-slate-50 transition-colors ${idx === 0 ? 'bg-indigo-50/30' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-4 shadow-sm ${idx === 0 ? 'bg-indigo-600' : 'bg-slate-500'}`}>
                                  {node.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{node.name}</div>
                                  {idx === 0 && <div className="text-[10px] uppercase font-bold text-indigo-600 mt-0.5">Primary Root Entity</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, node.val * 3)}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-gray-600">{node.val}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleNodeClick(node)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                                View Record
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Details Panel for Graph View Only */}
          {selectedNode && selectedNode.desc && viewMode === 'graph' && (
            <div className="absolute top-[20px] left-8 w-[350px] bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-2xl z-30 pointer-events-auto">
              <div className="p-6 border-b border-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </div>
                   <div>
                      <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedNode.name}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-1">Entity Intelligence Record</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedNode.desc}</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default KnowledgeGraph;
