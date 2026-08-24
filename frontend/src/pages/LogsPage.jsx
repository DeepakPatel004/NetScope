import React, { useState, useEffect } from 'react';
import { Terminal, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import api from '../services/api.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/logs').catch(() => ({ data: { data: [] } }));
      setLogs(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load system audit logs', err);
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
    <div className="p-8 md:p-10 bg-[#0B0F19] min-h-screen text-slate-100 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Terminal size={28} className="text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
              CENTRALIZED SYSTEM AUDIT LOGS
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            System-wide audit trail recording user operations, device creations, and AI investigation events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111827] border border-[#1E293B] p-4 rounded-2xl">
        <div className="relative w-full sm:w-96">
          <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by action, user, or entity..."
            className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs font-mono pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Spacious Audit Table (56px row height + expandable details) */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-4 px-4 font-bold">Timestamp</th>
                <th className="py-4 px-4 font-bold">Action</th>
                <th className="py-4 px-4 font-bold">Entity Type</th>
                <th className="py-4 px-4 font-bold">Operator</th>
                <th className="py-4 px-4 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 text-slate-200 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                    No matching system audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-[#1E293B]/40 transition cursor-pointer"
                        style={{ height: '56px' }}
                      >
                        <td className="py-4 px-4 text-slate-400 font-mono">
                          {new Date(log.createdAt || Date.now()).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-bold text-indigo-300">
                          {log.action}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {log.entityType || 'SYSTEM'}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-bold">
                          {log.user?.fullName || log.user?.username || 'System Operator'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="text-indigo-400 font-bold text-[11px] inline-flex items-center gap-1">
                            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-[#0B0F19] p-4 border-b border-[#1E293B]">
                            <div className="space-y-2 text-xs font-mono">
                              <span className="text-slate-400 uppercase text-[10px] font-bold block">Log Context Metadata</span>
                              <pre className="p-3 bg-[#030712] border border-slate-800 rounded-xl text-emerald-300 text-[11px] overflow-x-auto">
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
