import React, { useEffect, useState } from 'react';
import { Terminal, Activity, CheckCircle2 } from 'lucide-react';
import { dashboardService } from '../services/dashboard.service.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealLogs = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getDevicesStatus();
        const devices = res?.data || [];
        
        // Build real logs trace from active devices
        const realLogsList = devices.map((d) => {
          const time = d.lastChecked ? new Date(d.lastChecked).toLocaleTimeString() : 'Just now';
          const isUp = d.status === 'UP';
          return {
            id: d.id,
            time,
            level: isUp ? 'INFO' : 'ALERT',
            msg: isUp 
              ? `Telemetry ping check succeeded for ${d.name || d.host} (${d.latency || 0}ms)` 
              : `Endpoint unreachable or status warning for ${d.name || d.host}`
          };
        });

        setLogs(realLogsList);
      } catch (err) {
        console.error('Failed to load system logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealLogs();
  }, []);

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="border-b border-[#1E293B] pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Terminal size={24} className="text-emerald-400" />
          Audit Ledger & System Logs
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Real-time worker execution logs, anomaly events, and HTTP audit trails
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-2">
          <Activity size={24} className="animate-spin text-emerald-400" />
          <span>Polling telemetry audit ledger...</span>
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-[#0B0D1B] border border-[#1E293B] rounded-xl p-5 font-mono text-xs space-y-2 text-slate-300">
          {logs.map((l, i) => (
            <div key={l.id || i} className="flex items-center gap-3 border-b border-[#1E293B]/40 pb-2">
              <span className="text-slate-500 font-bold">{l.time}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                l.level === 'ERROR' || l.level === 'ALERT' 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {l.level}
              </span>
              <span className="text-slate-200">{l.msg}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 bg-[#111827] border border-dashed border-[#1E293B] rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 size={32} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Audit Ledger Standby</h3>
          <p className="text-xs text-slate-400 max-w-sm font-mono">
            No audit events recorded yet. Background health workers will populate ping records automatically.
          </p>
        </div>
      )}
    </div>
  );
}
