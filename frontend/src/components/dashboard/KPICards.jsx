import React from 'react';
import { Activity, Clock, Zap, Server, Bell } from 'lucide-react';

export default function KPICards({ metrics = null, devices = [] }) {
  const realTotal = metrics?.totalDevices ?? devices.length;
  const realUp = devices.filter(d => d.status === 'UP').length;
  const realDown = devices.filter(d => d.status === 'DOWN').length;

  const realAvgLat = metrics?.averageLatency ?? (
    devices.length > 0
      ? Math.round(devices.reduce((acc, d) => acc + (d.latency || 0), 0) / devices.length)
      : 0
  );

  const realMaxLat = metrics?.maxLatency ?? (
    devices.length > 0
      ? Math.max(...devices.map(d => d.latency || 0), 0)
      : 0
  );

  const uptime = metrics?.uptimePercentage ?? (
    realTotal > 0 ? Number(((realUp / realTotal) * 100).toFixed(2)) : 100.0
  );

  const openIncidents = metrics?.activeIncidentsCount ?? realDown;

  const cards = [
    {
      title: 'Uptime Index',
      value: `${typeof uptime === 'number' ? uptime.toFixed(2) : uptime}%`,
      trend: realTotal > 0 ? `${realUp}/${realTotal} UP` : 'Operational',
      trendLabel: 'real-time status',
      trendPositive: true,
      icon: Activity,
      iconBg: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
    },
    {
      title: 'Avg Latency',
      value: `${realAvgLat} ms`,
      trend: realAvgLat > 0 ? 'Live average' : 'Awaiting checks',
      trendLabel: 'socket ping',
      trendPositive: true,
      icon: Clock,
      iconBg: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30',
    },
    {
      title: 'Max Latency',
      value: `${realMaxLat} ms`,
      trend: realMaxLat > 1000 ? 'High peak' : 'Normal range',
      trendLabel: 'peak check',
      trendPositive: realMaxLat <= 1000,
      icon: Zap,
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
    },
    {
      title: 'Monitored Endpoints',
      value: `${realTotal}`,
      trend: `${realUp} active`,
      trendLabel: 'configured',
      trendPositive: true,
      icon: Server,
      iconBg: 'bg-[#0EA5E9]/15 text-[#0EA5E9] border-[#0EA5E9]/30',
    },
    {
      title: 'Incidents (Open)',
      value: `${openIncidents}`,
      trend: openIncidents > 0 ? `${openIncidents} DOWN` : '0 DOWN',
      trendLabel: 'active downtime',
      trendPositive: openIncidents === 0,
      icon: Bell,
      iconBg: openIncidents > 0 ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-[#111827] border border-[#1E293B] hover:border-slate-700 rounded-xl p-4 transition duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 truncate">{card.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${card.iconBg}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="text-2xl font-extrabold text-white tracking-tight mb-2">
              {card.value}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className={`font-bold ${card.trendPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {card.trend}
              </span>
              <span className="text-slate-500">{card.trendLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
