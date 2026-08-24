import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Server as ServerIcon, Cpu, HardDrive, Activity, ShieldAlert, CheckCircle2, Copy, Check } from 'lucide-react';

export default function DeviceHostHealth() {
  const { device = {}, agentMetrics = [], capabilities = {}, agentConnected: ctxAgentConnected } = useOutletContext() || {};
  const [metricTab, setMetricTab] = useState('cpu');
  const [copied, setCopied] = useState(false);

  const agentConnected = ctxAgentConnected !== undefined 
    ? ctxAgentConnected 
    : (device.agentStatus === 'ONLINE' || capabilities?.agentConnected || (agentMetrics && agentMetrics.length > 0));

  const latestMetric = agentMetrics[agentMetrics.length - 1] || null;

  const chartData = agentMetrics.map((m) => ({
    time: new Date(m.checkedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cpu: m.cpuPercent || 0,
    ram: m.ramPercent || 0,
    disk: m.diskPercent || 0,
  }));

  const handleCopyCmd = () => {
    if (!device?.agentKey) return;
    const cmd = `python agent/agent.py --server=${window.location.origin.replace(':5173', ':5000')} --key=${device.agentKey}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <ServerIcon size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">HOST INFRASTRUCTURE HEALTH</h2>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
            agentConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            Agent: {agentConnected ? '🟢 Connected' : '🔴 Offline'}
          </span>
        </div>

        {!agentConnected ? (
          <div className="p-6 bg-[#0B0F19] border border-amber-500/30 rounded-xl space-y-4 text-center">
            <ShieldAlert size={32} className="text-amber-400 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-slate-200">NetScope Agent Not Connected</h3>
              <p className="text-slate-400 mt-1 max-w-md mx-auto">
                Host CPU, RAM, Disk, Load, and Network metrics require the NetScope Agent running on your server host.
              </p>
            </div>

            <div className="max-w-xl mx-auto p-3 bg-[#030712] border border-slate-800 rounded-xl text-left space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Run on Server Host:</span>
              <div className="p-2 bg-[#0B0F19] rounded text-emerald-300 text-[11px] truncate">
                python agent/agent.py --server={window.location.origin.replace(':5173', ':5000')} --key={device.agentKey || 'KEY'}
              </div>
              <button
                onClick={handleCopyCmd}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Command Copied' : 'Copy CLI Command'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">CPU Load</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {latestMetric?.cpuPercent !== undefined ? `${latestMetric.cpuPercent.toFixed(1)}%` : '—'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">● Host Core</span>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">RAM Usage</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {latestMetric?.ramPercent !== undefined ? `${latestMetric.ramPercent.toFixed(1)}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {latestMetric?.ramUsedMb ? `${latestMetric.ramUsedMb}MB / ${latestMetric.ramTotalMb}MB` : 'Memory'}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Disk Capacity</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {latestMetric?.diskPercent !== undefined ? `${latestMetric.diskPercent.toFixed(1)}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {latestMetric?.diskUsedGb ? `${latestMetric.diskUsedGb}GB / ${latestMetric.diskTotalGb}GB` : 'Storage'}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">System Load</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {latestMetric?.loadAvg !== undefined ? latestMetric.loadAvg : '—'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">1m load average</span>
            </div>
          </div>
        )}
      </div>

      {agentConnected && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">HOST TELEMETRY TRENDS</h3>
            <div className="flex gap-2">
              {['cpu', 'ram', 'disk'].map((t) => (
                <button
                  key={t}
                  onClick={() => setMetricTab(t)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    metricTab === t ? 'bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-400 border border-[#1E293B]'
                  }`}
                >
                  [{t.toUpperCase()}]
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hostHealthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey={metricTab} stroke="#6366F1" strokeWidth={2.5} fill="url(#hostHealthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
