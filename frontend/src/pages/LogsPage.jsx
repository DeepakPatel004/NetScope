import React, { useState, useEffect } from 'react';
import { Terminal, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import api from '../services/api.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/logs');
      setLogs(res.data?.data || []);
      setError('');
    } catch (err) {
      setError('Could not load activity logs. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.entityType && l.entityType.toLowerCase().includes(term)) ||
      (l.user?.username && l.user.username.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-8 md:p-10 bg-[#101214] min-h-screen text-slate-100 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2b3036] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Terminal size={28} className="text-teal-400" />
            <h1 className="text-2xl md:text-3xl font-semibold text-white font-sans tracking-tight">
              Activity logs
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            System-wide audit trail recording user operations, device creations, and AI investigation events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-[#181b1f] hover:bg-[#2b3036] border border-[#2b3036] text-slate-300 px-4 py-2.5 rounded-xl font-sans text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-teal-400' : ''} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {error && <p role="alert" className="text-rose-300">{error}</p>}
      {/* Filter Bar */}
      <div className="bg-[#181b1f] border border-[#2b3036] p-4 rounded-xl">
        <div className="relative w-full sm:w-96">
          <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by action, user, or entity..."
            className="w-full bg-[#101214] border border-[#2b3036] text-slate-200 text-xs font-sans pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Spacious Audit Table (56px row height + expandable details) */}
      <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[#2b3036] text-slate-400 font-sans text-[11px] uppercase tracking-wider">
                <th className="py-4 px-4 font-bold">Timestamp</th>
                <th className="py-4 px-4 font-bold">Action</th>
                <th className="py-4 px-4 font-bold">Entity Type</th>
                <th className="py-4 px-4 font-bold">Operator</th>
                <th className="py-4 px-4 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3036]/60 text-slate-200 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    {loading ? 'Loading logs…' : error ? 'Logs unavailable.' : 'No matching activity recorded.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-[#2b3036]/40 transition cursor-pointer"
                        style={{ height: '56px' }}
                      >
                        <td className="py-4 px-4 text-slate-400 font-sans">
                          {new Date(log.createdAt || Date.now()).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-bold text-teal-300">
                          {log.action}
                        </td>
                        <td className="py-4 px-4 font-sans text-slate-300">
                          {log.entityType || 'SYSTEM'}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-bold">
                          {log.user?.fullName || log.user?.username || 'System Operator'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="text-teal-400 font-bold text-[11px] inline-flex items-center gap-1">
                            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-[#101214] p-4 border-b border-[#2b3036]">
                            <div className="space-y-2 text-xs font-sans">
                              <span className="text-slate-400 uppercase text-[10px] font-bold block">Log Context Metadata</span>
                              <pre className="p-3 bg-[#0d0f11] border border-slate-800 rounded-xl text-emerald-300 text-[11px] overflow-x-auto">
                                {JSON.stringify(log.details || { action: log.action, entityId: log.entityId }, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
