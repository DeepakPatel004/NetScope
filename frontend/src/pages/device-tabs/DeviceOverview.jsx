import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { 
  Settings, Play, Activity, Server as ServerIcon, Globe, Sparkles, 
  ShieldAlert, CheckCircle2, AlertTriangle, Cpu, HardDrive, Info, Layers, Box, Terminal
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label, unit = 'ms' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A] border border-[#334155] p-2.5 rounded-xl shadow-xl text-xs text-white font-mono">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-emerald-400 font-bold text-sm">{payload[0].value} {unit}</p>
      </div>
    );
  }
  return null;
};

export default function DeviceOverview() {
  const navigate = useNavigate();
  const {
    analytics,
    healthHistory = [],
    agentMetrics = [],
    incidents = [],
    device = {},
    capabilities = {},
    checking,
    handleManualCheck,
  } = useOutletContext() || {};

  const [hostChartTab, setHostChartTab] = useState('cpu'); // 'cpu', 'ram', 'load'
  const [serviceChartTab, setServiceChartTab] = useState('latency'); // 'latency', 'availability'

  const { hostMonitoring, serviceMonitoring, agentConnected } = capabilities;

  const safeLogs = Array.isArray(healthHistory) ? healthHistory : [];
  const logsReversed = [...safeLogs].reverse();

  // Service Telemetry Chart Data
  const serviceChartData = logsReversed
    .filter((h) => h.latency !== undefined && h.latency !== null)
    .map((h) => ({
      time: new Date(h.checkedAt || h.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latency: h.latency || 0,
      availability: h.status === 'UP' ? 100 : 0,
    }));

  // Host Telemetry Chart Data
  const hostChartData = (agentMetrics || []).map((m) => ({
    time: new Date(m.checkedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cpu: m.cpuPercent || 0,
    ram: m.ramPercent || 0,
    load: m.loadAvg || 0,
  }));

  const latestLog = safeLogs[0] || {};
  const latestHostMetric = agentMetrics[agentMetrics.length - 1] || null;

  const latestCpu = latestHostMetric?.cpuPercent || 0;
  const latestRam = latestHostMetric?.ramPercent || 0;
  const latestLatency = latestLog?.latency || device.latency || null;

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  const containers = device.containers || [
    { id: 'd083ab27c6ec', name: 'demo-api', image: 'demo-backend:latest', status: 'Up 19 minutes', ports: '0.0.0.0:5000->5000/tcp' },
    { id: '2660f4db903e', name: 'demo-redis', image: 'redis:7-alpine', status: 'Up 19 minutes', ports: '0.0.0.0:6379->6379/tcp' }
  ];

  const composeProjects = device.dockerComposeProjects || ['netscope-demo'];

  return (
    <div className="space-y-6 font-mono text-xs">

      {/* OVERALL STATUS BANNER */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ServerIcon className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-base font-extrabold text-white">{device.name} Overview</h2>
            <p className="text-slate-400 text-[11px]">
              Agent Connection: <strong className={agentConnected ? 'text-emerald-400' : 'text-amber-400'}>{agentConnected ? '🟢 Connected' : '🔴 Disconnected'}</strong> | Docker Status: <strong className="text-indigo-300">{device.dockerStatus || 'RUNNING'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">Overall Health:</span>
          <span className={`px-3 py-1 rounded-full font-extrabold border ${
            activeIncidents.length > 0
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            {activeIncidents.length > 0 ? '⚠ DEGRADED' : '● HEALTHY'}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 1. DOCKER & CONTAINER DISCOVERY PANEL             */}
      {/* -------------------------------------------------- */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Box size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">ENVIRONMENT & DOCKER CONTAINER DISCOVERY</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            Compose Projects: {composeProjects.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {containers.map((c, idx) => (
            <div key={idx} className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {c.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Image: <code className="text-indigo-300">{c.image}</code></p>
              <p className="text-[10px] text-slate-500 truncate">Ports: {c.ports || 'Internal'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 2. HOST HEALTH                                    */}
      {/* -------------------------------------------------- */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">HOST HEALTH TELEMETRY</h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            agentConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            Agent: {agentConnected ? '● Connected' : '🔴 Offline'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">CPU Usage</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {latestHostMetric?.cpuPercent !== undefined ? `${latestHostMetric.cpuPercent.toFixed(1)}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-500">Host Core</span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">RAM Usage</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {latestHostMetric?.ramPercent !== undefined ? `${latestHostMetric.ramPercent.toFixed(1)}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-500">
              {latestHostMetric?.ramUsedMb ? `${latestHostMetric.ramUsedMb}MB` : 'Memory'}
            </span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Disk Usage</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {latestHostMetric?.diskPercent !== undefined ? `${latestHostMetric.diskPercent.toFixed(1)}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-500">Storage</span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Load Average</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {latestHostMetric?.loadAvg !== undefined ? latestHostMetric.loadAvg : '—'}
            </span>
            <span className="text-[10px] text-slate-500">1m average</span>
          </div>

          <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Network Traffic</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {latestHostMetric?.netBytesSent ? `${(latestHostMetric.netBytesSent / (1024 * 1024)).toFixed(1)}MB` : '—'}
            </span>
            <span className="text-[10px] text-slate-500">Tx Throughput</span>
          </div>
        </div>

        {/* Host Charts */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Host Metric Trend</span>
            <div className="flex items-center gap-2">
              {['cpu', 'ram', 'load'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHostChartTab(tab)}
                  className={`px-3 py-1 rounded-lg font-bold uppercase transition cursor-pointer ${
                    hostChartTab === tab ? 'bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-400 border border-[#1E293B]'
                  }`}
                >
                  [{tab}]
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3">
            {hostChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hostChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit={hostChartTab === 'load' ? '' : '%'} />} />
                  <Area
                    type="monotone"
                    dataKey={hostChartTab}
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#hostGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-bold">
                Waiting for host telemetry data...
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
