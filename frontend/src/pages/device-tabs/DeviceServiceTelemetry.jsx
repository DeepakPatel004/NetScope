import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Globe, Play, Activity, Settings, CheckCircle2 } from 'lucide-react';

export default function DeviceServiceTelemetry() {
  const { healthHistory = [], analytics, device = {}, checking, handleManualCheck } = useOutletContext() || {};
  const [metricTab, setMetricTab] = useState('latency');

  const safeLogs = Array.isArray(healthHistory) ? healthHistory : [];
  const logsReversed = [...safeLogs].reverse();

  const chartData = logsReversed.map((h) => ({
    time: new Date(h.checkedAt || h.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: h.latency || 0,
    availability: h.status === 'UP' ? 100 : 0,
  }));

  const latestLog = safeLogs[0] || {};
  const dnsTime = latestLog.dnsTime || 0;
  const tcpTime = latestLog.tcpTime || 0;
  const tlsTime = latestLog.tlsTime || 0;
  const ttfbTime = latestLog.ttfbTime || 0;
  const totalPhaseTime = Math.max(1, dnsTime + tcpTime + tlsTime + ttfbTime);

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">SERVICE HEALTH & LATENCY TELEMETRY</h2>
          </div>

          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <Play size={12} className={`rotate-90 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'PINGING...' : 'PING HEALTH'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">HTTP Status Code</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {latestLog.responseCode || 200}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Check response</span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Avg Latency</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {analytics ? `${analytics.avgLatency}ms` : `${device.latency || 0}ms`}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Round-trip mean</span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Uptime Ratio</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {analytics ? `${analytics.uptimePercentage.toFixed(2)}%` : '100%'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Check ratio</span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase">Max Latency</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {analytics ? `${analytics.maxLatency}ms` : `${device.latency || 0}ms`}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Peak ping limit</span>
          </div>
        </div>
      </div>

      {/* Service Telemetry Area Chart */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">SERVICE TELEMETRY TRENDS</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMetricTab('latency')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                metricTab === 'latency' ? 'bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-400 border border-[#1E293B]'
              }`}
            >
              [ Latency ]
            </button>
            <button
              onClick={() => setMetricTab('availability')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                metricTab === 'availability' ? 'bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-400 border border-[#1E293B]'
              }`}
            >
              [ Availability ]
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="serviceHealthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey={metricTab} stroke="#10B981" strokeWidth={2.5} fill="url(#serviceHealthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-[#1E293B] rounded-xl space-y-2 p-6 text-center">
              <Globe size={24} className="text-slate-600" />
              <span>No service telemetry available yet.</span>
            </div>
          )}
        </div>
      </div>

      {/* Network Phase Breakdown */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Network Phase Breakdown (DNS, TCP, TLS, TTFB)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-indigo-400 font-bold uppercase">🌐 DNS Lookup</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{dnsTime} ms</div>
          </div>
          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-amber-400 font-bold uppercase">🤝 TCP Connect</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{tcpTime} ms</div>
          </div>
          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-cyan-400 font-bold uppercase">🔒 TLS Handshake</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{tlsTime} ms</div>
          </div>
          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <div className="text-[10px] text-emerald-400 font-bold uppercase">⚡ TTFB</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{ttfbTime} ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}
