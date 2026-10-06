import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Globe, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ResourceHealthTable({ devices = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b3036] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Latest health checks</h2>
          <p className="text-xs text-slate-400 mt-1">Endpoint status and response time from the latest checks</p>
        </div>

        <button
          onClick={() => navigate('/devices')}
          className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition cursor-pointer self-start sm:self-auto font-sans"
        >
          View devices ({devices.length}) &rarr;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-[#2b3036] text-slate-400 font-sans text-[11px] uppercase tracking-wider">
              <th className="py-4 px-4 font-bold">Resource</th>
              <th className="py-4 px-4 font-bold">Type</th>
              <th className="py-4 px-4 font-bold">Health Status</th>
              <th className="py-4 px-4 font-bold">Latency</th>
              
              <th className="py-4 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2b3036]/60 text-slate-200 font-sans">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                  No monitored resources registered. Click "+ Add Device" to start monitoring.
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const isServer = device.type === 'SERVER' || device.type === 'WORKER';
                const isHealthy = device.status === 'UP';

                return (
                  <tr
                    key={device.id}
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="hover:bg-[#2b3036]/40 transition cursor-pointer group"
                    style={{ height: '64px' }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#101214] border border-[#2b3036] rounded-xl text-teal-400">
                          {isServer ? <Server size={16} /> : <Globe size={16} />}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm group-hover:text-teal-300 transition block">
                            {device.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans block">{device.host}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-sans">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 font-bold text-[11px]">
                        {device.type}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {isHealthy ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 " />
                          Healthy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <span className="w-2 h-2 rounded-full bg-rose-500 " />
                          {device.status === 'DOWN' ? 'Down' : 'Unknown'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-sans text-sm font-bold text-cyan-300">
                      {typeof device.latency === 'number' ? `${device.latency} ms` : '—'}
                    </td>



                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 group-hover:text-teal-300 transition">
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
