import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Info, Activity, Globe, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0F172A] border border-[#334155] p-3 rounded-xl shadow-xl text-xs text-white">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-indigo-400 font-bold text-sm">{payload[0].value} ms</p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          Target: <strong className="text-slate-200">{data.deviceName || 'Monitored Endpoint'}</strong>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
          Status: <strong className={data.status === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>{data.status || 'UP'}</strong>
        </p>
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.isAnomaly || payload.status === 'DOWN') {
    return (
      <g key={`dot-${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={7} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} className="animate-ping opacity-75" />
        <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
      </g>
    );
  }
  return null;
};

export default function LatencyOverviewChart({ healthHistory = [], devices = [] }) {
  const navigate = useNavigate();
  const [selectedDeviceId, setSelectedDeviceId] = useState('ALL');

  // Filter devices/logs if a specific device is selected
  const rawLogs = healthHistory && healthHistory.length > 0
    ? [...healthHistory].reverse()
    : devices.map(d => ({
        id: d.id,
        deviceName: d.name || d.host,
        checkedAt: d.lastChecked || new Date().toISOString(),
        latency: d.latency || 0,
        status: d.status || 'UP'
      }));

  const chartData = rawLogs.map((log) => {
    const dateObj = new Date(log.checkedAt || log.createdAt || Date.now());
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const devName = typeof log.deviceName === 'string' ? log.deviceName : (log.device?.name || log.device?.host || 'Monitored Target');
    return {
      time: timeStr,
      latency: log.latency || 0,
      status: log.status || 'UP',
      deviceName: devName,
      isAnomaly: (log.latency || 0) > 1500 || log.status === 'DOWN',
    };
  });

  const avgLatency = chartData.length > 0
    ? Math.round(chartData.reduce((acc, curr) => acc + (curr.latency || 0), 0) / chartData.length)
    : 0;

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#1E293B] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">
              {selectedDeviceId === 'ALL' ? 'Global Latency (All Endpoints)' : 'Endpoint Telemetry Latency'}
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
              {selectedDeviceId === 'ALL' ? 'Aggregate View' : 'Single Target'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time ping duration across monitored network targets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-[#0B0F19] border border-[#1E293B] text-slate-300 text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Endpoints ({devices.length})</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.host}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => navigate('/devices')}
            className="text-xs font-semibold text-[#818CF8] hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
            title="Manage Monitored Devices Catalog"
          >
            <span>Devices Catalog</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Chart Body */}
      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {avgLatency > 0 && (
                <ReferenceLine y={avgLatency} stroke="#6366F1" strokeDasharray="4 4" label={{ value: `Avg (${avgLatency}ms)`, fill: '#818CF8', fontSize: 10, position: 'insideTopRight' }} />
              )}
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#A855F7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#latencyGradient)"
                dot={<CustomDot />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full flex flex-col items-center justify-center border border-dashed border-[#1E293B] rounded-xl text-slate-500 space-y-2">
          <Activity size={28} className="animate-spin text-indigo-500" />
          <p className="text-xs font-semibold text-slate-300">Accumulating Telemetry Data...</p>
          <p className="text-[11px] text-slate-500 max-w-xs text-center font-mono">
            Background workers run automated ping checks every interval. Real-time latency points will stream here automatically.
          </p>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400 border-t border-[#1E293B] pt-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-[#A855F7] rounded-full inline-block" />
          <span>Ping Latency (ms)</span>
        </div>
        {avgLatency > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#6366F1] border-b border-dashed inline-block" />
            <span>Average ({avgLatency} ms)</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#EF4444] rounded-full inline-block" />
          <span>Latency Spike / Failure</span>
        </div>
      </div>
    </div>
  );
}
