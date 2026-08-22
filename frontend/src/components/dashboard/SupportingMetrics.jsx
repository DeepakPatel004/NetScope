import React from 'react';
import { Activity, Server, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SupportingMetrics({ metrics = null, devices = [] }) {
  const avgLatency = metrics?.averageLatency ?? (devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + (d.latency || 0), 0) / devices.length) : 0);
  const totalDevices = metrics?.totalDevices ?? devices.length;
  const upDevices = devices.length > 0 ? devices.filter(d => d.status === 'UP').length : totalDevices;
  const sslCount = devices.filter(d => d.type === 'WEBSITE' || d.type === 'API').length;

  const data = [
    {
      title: 'Avg Response Latency',
      value: `${avgLatency} ms`,
      sub: 'Real-time telemetry average',
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Monitored Endpoints',
      value: `${totalDevices} Devices`,
      sub: `${upDevices} / ${totalDevices} Endpoints Healthy`,
      icon: Server,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'SSL Security Audits',
      value: `${sslCount} HTTPS Targets`,
      sub: 'Automated TLS Expiry Tracking',
      icon: ShieldCheck,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Platform Availability',
      value: `${metrics?.uptimePercentage ? metrics.uptimePercentage.toFixed(2) : '100.00'}%`,
      sub: 'Zero unexpected downtime',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-[#111827] border border-[#1E293B] hover:border-slate-700 rounded-xl p-4 flex items-center justify-between transition"
          >
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">{item.title}</span>
              <span className="text-xl font-extrabold text-white block mb-1">{item.value}</span>
              <span className="text-[11px] font-medium text-slate-500">{item.sub}</span>
            </div>

            <div className={`p-3 rounded-xl border ${item.color} shrink-0`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
