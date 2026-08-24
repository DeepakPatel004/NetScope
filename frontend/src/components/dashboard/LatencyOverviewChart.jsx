import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A] border border-[#334155] p-3 rounded-xl shadow-xl text-xs text-white font-mono space-y-1">
        <p className="font-semibold text-slate-400">{label}</p>
        <p className="font-extrabold text-cyan-400 text-sm">
          Response Latency: {payload[0].value} ms
        </p>
      </div>
    );
  }
  return null;
};

export default function LatencyOverviewChart({ devices = [] }) {
  const [selectedTarget, setSelectedTarget] = useState('ALL');

  const hasDevices = devices.length > 0;
  const timeLabels = ['12:00', '12:05', '12:10', '12:15', '12:20', '12:25', '12:30', '12:35', '12:40', '12:45', '12:50', '12:55'];
  
  const chartData = timeLabels.map((time, idx) => {
    if (!hasDevices) return { time, latency: 0 };
    const baseLatency = devices[0]?.latency || 0;
    const variation = Math.sin(idx) * 18 + (idx === 7 ? 65 : 0);
    return {
      time,
      latency: Math.max(0, Math.round(baseLatency + variation)),
    };
  });

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock size={20} className="text-cyan-400" /> SERVICE RESPONSE LATENCY TREND
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time HTTP response times across target endpoints</p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 font-semibold">Target:</span>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="bg-[#0B0F19] border border-[#1E293B] text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Targets (Aggregate)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spacious 350px Chart */}
      <div className="h-80 w-full bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} unit="ms" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="latency"
              stroke="#06B6D4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#latencyGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
