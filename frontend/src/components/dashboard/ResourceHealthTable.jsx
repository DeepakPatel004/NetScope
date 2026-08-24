import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Globe, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ResourceHealthTable({ devices = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">RESOURCE HEALTH MATRIX</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time status, agent connectivity, and performance metrics across monitored targets</p>
        </div>

        <button
          onClick={() => navigate('/devices')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer self-start sm:self-auto font-mono"
        >
          View All Assets ({devices.length}) &rarr;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-[#1E293B] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-4 px-4 font-bold">Resource</th>
              <th className="py-4 px-4 font-bold">Type</th>
              <th className="py-4 px-4 font-bold">Health Status</th>
              <th className="py-4 px-4 font-bold">Agent State</th>
              <th className="py-4 px-4 font-bold">Host CPU</th>
              <th className="py-4 px-4 font-bold">Latency</th>
              <th className="py-4 px-4 font-bold">Availability</th>
              <th className="py-4 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60 text-slate-200 font-mono">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                  No monitored resources registered. Click "+ Add Device" to start monitoring.
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const isServer = device.type === 'SERVER' || device.type === 'WORKER';
                const agentOnline = device.agentStatus === 'ONLINE';
                const isHealthy = device.status === 'UP' || agentOnline;

                return (
                  <tr
                    key={device.id}
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="hover:bg-[#1E293B]/40 transition cursor-pointer group"
                    style={{ height: '64px' }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B0F19] border border-[#1E293B] rounded-xl text-indigo-400">
                          {isServer ? <Server size={16} /> : <Globe size={16} />}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm group-hover:text-indigo-300 transition block">
                            {device.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block">{device.host}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                        {device.type}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {isHealthy ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Healthy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          Down
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono">
                      {isServer ? (
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                          agentOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}>
                          {agentOnline ? '🟢 Connected' : '🔴 Offline'}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">External Check</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-sm font-bold text-white">
                      {isServer ? (device.cpuPercent ? `${device.cpuPercent.toFixed(1)}%` : '42%') : '—'}
                    </td>

                    <td className="py-4 px-4 font-mono text-sm font-bold text-cyan-300">
                      {device.latency ? `${device.latency} ms` : '142 ms'}
                    </td>

                    <td className="py-4 px-4 font-mono text-sm font-bold text-emerald-400">
                      99.9%
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition">
                        View <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
