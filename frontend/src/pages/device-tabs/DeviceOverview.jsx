import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Settings, Play, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A] border border-[#334155] p-2.5 rounded-xl shadow-xl text-xs text-white">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-emerald-400 font-bold text-sm">{payload[0].value} ms</p>
      </div>
    );
  }
  return null;
};

export default function DeviceOverview() {
  const {
    analytics,
    healthHistory = [],
    device = {},
    checking,
    handleManualCheck,
    formatDate
  } = useOutletContext() || {};

  const safeLogs = Array.isArray(healthHistory) ? healthHistory : [];
  const logsReversed = [...safeLogs].reverse();

  const chartData = logsReversed.map((h) => ({
    time: new Date(h.checkedAt || h.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: h.latency || 0,
    status: h.status || 'UP',
  }));

  const latestLog = safeLogs[0] || {};
  const dnsTime = latestLog.dnsTime || 0;
  const tcpTime = latestLog.tcpTime || 0;
  const tlsTime = latestLog.tlsTime || 0;
  const ttfbTime = latestLog.ttfbTime || 0;
  const totalPhaseTime = Math.max(1, dnsTime + tcpTime + tlsTime + ttfbTime);

  return (
    <div className="space-y-6">
      {/* 3 Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between min-h-[120px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Uptime Index</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {analytics ? `${analytics.uptimePercentage.toFixed(2)}%` : '100.00%'}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-2">Active ping success ratio</div>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between min-h-[120px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Avg Latency</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {analytics ? `${analytics.avgLatency} ms` : `${device.latency || 0} ms`}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-2">Mean round-trip audit</div>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between min-h-[120px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Max Latency</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {analytics ? `${analytics.maxLatency} ms` : `${device.latency || 0} ms`}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-2">Peak ping limit logged</div>
        </div>
      </div>

      {/* Main Latency Chart */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Latency Sweep History</h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Recharts SVG Telemetry</span>
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Play size={12} className={`rotate-90 text-white ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'PINGING...' : 'PING HEALTH'}</span>
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="devOverviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#devOverviewGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs font-mono text-slate-500 border border-dashed border-[#1E293B] rounded-xl space-y-2">
              <Activity size={24} className="animate-spin text-emerald-400" />
              <span>NO HEALTH SWEEPS LOGGED YET</span>
            </div>
          )}
        </div>
      </div>

      {/* Network Phase Latency Breakdown (OSI Layer Diagnostics) */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
              Network Phase Latency Breakdown (OSI Layer Diagnostics)
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            Latest Audit Sweep
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-mono">
          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">🌐 DNS Lookup</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{dnsTime} <span className="text-xs text-slate-500 font-normal">ms</span></div>
            <div className="text-[10px] text-slate-500 mt-1">Domain resolution</div>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">🤝 TCP Connect</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{tcpTime} <span className="text-xs text-slate-500 font-normal">ms</span></div>
            <div className="text-[10px] text-slate-500 mt-1">Socket handshake</div>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">🔒 TLS Handshake</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{tlsTime} <span className="text-xs text-slate-500 font-normal">ms</span></div>
            <div className="text-[10px] text-slate-500 mt-1">SSL/TLS negotiation</div>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">⚡ TTFB</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{ttfbTime} <span className="text-xs text-slate-500 font-normal">ms</span></div>
            <div className="text-[10px] text-slate-500 mt-1">First byte response</div>
          </div>
        </div>

        <div className="space-y-1.5 font-mono text-[10px]">
          <div className="flex justify-between text-slate-400">
            <span>Phase Latency Distribution</span>
            <span>Total Latency: {latestLog.latency || device.latency || 0} ms</span>
          </div>
          <div className="w-full h-3 bg-[#0B0F19] rounded-full overflow-hidden flex border border-[#1E293B]">
            <div style={{ width: `${Math.min(100, Math.max(5, (dnsTime / totalPhaseTime) * 100))}%` }} className="bg-indigo-500 h-full" title={`DNS: ${dnsTime}ms`} />
            <div style={{ width: `${Math.min(100, Math.max(5, (tcpTime / totalPhaseTime) * 100))}%` }} className="bg-amber-500 h-full" title={`TCP: ${tcpTime}ms`} />
            <div style={{ width: `${Math.min(100, Math.max(5, (tlsTime / totalPhaseTime) * 100))}%` }} className="bg-cyan-500 h-full" title={`TLS: ${tlsTime}ms`} />
            <div style={{ width: `${Math.min(100, Math.max(5, (ttfbTime / totalPhaseTime) * 100))}%` }} className="bg-emerald-500 h-full" title={`TTFB: ${ttfbTime}ms`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Registry Datagrams</h3>
          </div>
          <div className="space-y-3 font-mono text-xs mt-4">
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-500">Target Type:</span>
              <span className="font-semibold text-slate-300">{device.type || 'WEBSITE'}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-500">Target Host:</span>
              <span className="font-semibold text-slate-300">{device.host || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-500">Registered On:</span>
              <span className="font-semibold text-slate-300">{formatDate ? formatDate(device.createdAt) : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Diagnostics Guide & Benefits</h3>
              <Settings size={16} className="text-slate-500" />
            </div>
            <div className="space-y-4 text-xs font-mono">
              <div>
                <h4 className="text-emerald-400 font-bold text-xs">⏱️ Latency & Uptime</h4>
                <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                  Latency measures network lag, and Uptime measures accessibility. Lower lag speeds up load times, directly improving Google SEO rank and user retention.
                </p>
              </div>
              <div>
                <h4 className="text-indigo-400 font-bold text-xs">🔒 SSL Certificate encryption</h4>
                <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                  Secures connections between visitors and servers. Keeping certificates valid avoids scary browser safety warning screens that block traffic.
                </p>
              </div>
              <div>
                <h4 className="text-amber-400 font-bold text-xs">🛡️ Open Port auditing</h4>
                <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                  Scans exposed entrance points on your server. Keeping unused ports closed blocks potential hackers from executing raw TCP exploits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
