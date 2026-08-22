import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

const generateRealLast7Days = (healthHistory = []) => {
  const days = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Calculate real uptime percentage for this date if health logs exist
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();
    
    const logsForDay = healthHistory.filter((log) => {
      const logTime = new Date(log.checkedAt || log.createdAt).getTime();
      return logTime >= dayStart && logTime <= dayEnd;
    });

    let uptime = 100.0;
    if (logsForDay.length > 0) {
      const upCount = logsForDay.filter((l) => l.status === 'UP').length;
      uptime = Number(((upCount / logsForDay.length) * 100).toFixed(1));
    }

    days.push({
      date: dateStr,
      uptime: uptime,
      hasData: logsForDay.length > 0,
      count: logsForDay.length,
    });
  }

  return days;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0F172A] border border-[#334155] p-2.5 rounded-lg shadow-xl text-xs text-white">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-[#10B981] font-bold text-sm">Uptime: {payload[0].value}%</p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
          {data.hasData ? `${data.count} telemetry checks` : 'No downtime recorded'}
        </p>
      </div>
    );
  }
  return null;
};

export default function UptimeHistoryChart({ healthHistory = [] }) {
  const navigate = useNavigate();
  const chartData = generateRealLast7Days(healthHistory);

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Uptime History</h3>
          <p className="text-[11px] text-slate-400 font-normal">Real-time daily availability (Last 7 days)</p>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-44 w-full my-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[90, 100]} ticks={[90, 92.5, 95, 97.5, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="uptime" fill="#10B981" radius={[4, 4, 0, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Link Footer */}
      <div className="border-t border-[#1E293B] pt-3 text-right">
        <button
          onClick={() => navigate('/reports')}
          className="text-xs font-semibold text-[#818CF8] hover:text-indigo-300 transition cursor-pointer"
        >
          View Full Report &rarr;
        </button>
      </div>
    </div>
  );
}
