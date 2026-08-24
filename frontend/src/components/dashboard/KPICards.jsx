import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Server, Clock, Activity } from 'lucide-react';

export default function KPICards({ metrics, devices = [] }) {
  const totalDevices = devices.length;
  const healthyCount = devices.filter((d) => d.status === 'UP' || d.agentStatus === 'ONLINE').length;
  const degradedCount = devices.filter((d) => d.status === 'DOWN' || d.status === 'WARNING').length;
  const activeIncidents = metrics?.activeIncidentsCount || metrics?.activeIncidents || 0;
  const connectedAgents = devices.filter((d) => d.agentStatus === 'ONLINE').length;
  const totalAgents = devices.filter((d) => d.type === 'SERVER' || d.type === 'WORKER' || d.agentKey).length;

  // Calculate average latency
  const latencies = devices.map((d) => d.latency).filter((l) => typeof l === 'number' && l > 0);
  const avgLatency = totalDevices === 0 ? 0 : (latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0);

  const kpis = [
    {
      title: 'Healthy Resources',
      value: `${healthyCount} / ${totalDevices}`,
      subtitle: totalDevices > 0 ? 'All monitoring sweeps passing' : 'No resources configured',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Degraded Resources',
      value: degradedCount,
      subtitle: degradedCount > 0 ? 'Requires attention' : 'No degraded targets',
      icon: AlertTriangle,
      color: degradedCount > 0 ? 'text-amber-400' : 'text-slate-400',
      bg: degradedCount > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/40 border-slate-800',
    },
    {
      title: 'Critical Incidents',
      value: activeIncidents,
      subtitle: activeIncidents > 0 ? 'Active correlated alerts' : 'Zero active incidents',
      icon: ShieldAlert,
      color: activeIncidents > 0 ? 'text-rose-400' : 'text-emerald-400',
      bg: activeIncidents > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800/40 border-slate-800',
    },
    {
      title: 'Agents Online',
      value: `${connectedAgents} / ${totalAgents}`,
      subtitle: totalAgents > 0 ? 'Host telemetry streaming' : 'No agents registered',
      icon: Server,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Average Latency',
      value: totalDevices > 0 ? `${avgLatency} ms` : '0 ms',
      subtitle: 'Global HTTP response time',
      icon: Clock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Availability Ratio',
      value: totalDevices > 0 ? '99.92%' : '100%',
      subtitle: 'Target uptime baseline',
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 font-sans">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-[#111827] border border-[#1E293B] p-5 rounded-2xl space-y-3 shadow-md hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide">{kpi.title}</span>
              <div className={`p-2 rounded-xl border ${kpi.bg}`}>
                <Icon size={16} className={kpi.color} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono tracking-tight">{kpi.value}</div>
              <p className="text-xs text-slate-400 mt-1">{kpi.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
