import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Globe, Play, Activity, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181b1f] border border-[#334155] p-2.5 rounded-xl shadow-sm text-xs text-white font-sans">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }} className="font-bold text-xs">
            {entry.name}: {entry.value} {entry.name.includes('Errors') || entry.name.includes('Availability') ? '%' : 'ms'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DevicePerformance() {
  const { healthHistory = [], device = {}, checking, handleManualCheck } = useOutletContext() || {};
  const [metricTab, setMetricTab] = useState('latency');

  const safeLogs = Array.isArray(healthHistory) ? healthHistory : [];
  const logsReversed = [...safeLogs].reverse();

  // Performance Chart Data
  const perfData = logsReversed
    .filter((h) => h.latency !== undefined && h.latency !== null)
    .map((h) => ({
      time: new Date(h.checkedAt || h.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latency: h.latency || 0,
      availability: h.status === 'UP' ? 100 : 0,
      httpErrors: h.status === 'DOWN' ? 100 : (h.responseCode >= 400 ? 100 : 0),
    }));

  const latestLog = safeLogs[0] || {};
  const latestLatency = latestLog.latency ?? '—';

  return (
    <div className="space-y-6 font-sans text-xs">

      {/* 1. SERVICE PERFORMANCE CHARTS */}
      <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2b3036] pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">SERVICE PERFORMANCE TRENDS</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {['latency', 'availability', 'errors'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMetricTab(tab)}
                  className={`px-3 py-1 rounded-lg font-bold uppercase transition cursor-pointer ${
                    metricTab === tab ? 'bg-teal-600 text-white' : 'bg-[#101214] text-slate-400 border border-[#2b3036]'
                  }`}
                >
                  [{tab}]
                </button>
              ))}
            </div>

            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition text-[11px] cursor-pointer disabled:opacity-50"
            >
              <Play size={11} className={`rotate-90 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'PINGING...' : 'PING HEALTH'}</span>
            </button>
          </div>
        </div>

        {/* Phase Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#101214] border border-[#2b3036] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Round-Trip Latency</span>
            <span className="text-xl font-semibold text-white mt-1 block">{latestLatency} ms</span>
            <span className="text-[10px] text-slate-500">Target response time</span>
          </div>

          <div className="bg-[#101214] border border-[#2b3036] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">DNS Lookup</span>
            <span className="text-xl font-semibold text-teal-400 mt-1 block">{latestLog.dnsTime ?? '—'} ms</span>
            <span className="text-[10px] text-slate-500">Domain resolution</span>
          </div>

          <div className="bg-[#101214] border border-[#2b3036] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">TLS Handshake</span>
            <span className="text-xl font-semibold text-cyan-400 mt-1 block">{latestLog.tlsTime ?? '—'} ms</span>
            <span className="text-[10px] text-slate-500">Secure socket setup</span>
          </div>

          <div className="bg-[#101214] border border-[#2b3036] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Time to First Byte</span>
            <span className="text-xl font-semibold text-emerald-400 mt-1 block">{latestLog.ttfbTime ?? '—'} ms</span>
            <span className="text-[10px] text-slate-500">TTFB server response</span>
          </div>
        </div>

        {/* Primary Performance Area Chart */}
        <div className="h-60 w-full bg-[#101214] border border-[#2b3036] rounded-xl p-3">
          {perfData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3036" vertical={false} />
                <XAxis dataKey="time" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={metricTab === 'errors' ? 'httpErrors' : metricTab}
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#perfGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-bold">
              Waiting for performance telemetry data...
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
