import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  Healthy: '#10B981',
  Warning: '#F59E0B',
  Critical: '#EF4444',
  Unknown: '#8b949e',
};

export default function DeviceStatusDonut({ statusData = null, totalCount = 24 }) {
  const navigate = useNavigate();

  const data = statusData || [
    { name: 'Healthy', value: 18, pct: '75%' },
    { name: 'Warning', value: 3, pct: '12.5%' },
    { name: 'Critical', value: 2, pct: '8.3%' },
    { name: 'Unknown', value: 1, pct: '4.2%' },
  ];

  const total = statusData ? statusData.reduce((acc, curr) => acc + curr.value, 0) : totalCount;

  return (
    <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-white tracking-wide">Device Status</h3>
        <p className="text-xs text-slate-400 mt-0.5 font-normal">Total: {total}</p>
      </div>

      {/* Donut Chart & Legend */}
      <div className="flex items-center justify-between my-2">
        {/* Recharts Pie Donut */}
        <div className="h-40 w-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8b949e'} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold text-white">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
          </div>
        </div>

        {/* Status Breakdown Legend */}
        <div className="space-y-2 text-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: STATUS_COLORS[item.name] || '#8b949e' }}
                />
                <span className="text-slate-300 font-medium">{item.name}</span>
              </div>
              <span className="text-slate-400 font-semibold">{item.value} ({item.pct || `${Math.round((item.value / total) * 100)}%`})</span>
            </div>
          ))}
        </div>
      </div>

      {/* View All Devices Link */}
      <div className="border-t border-[#2b3036] pt-3 text-left">
        <button
          onClick={() => navigate('/devices')}
          className="text-xs font-semibold text-[#5eead4] hover:text-teal-300 transition flex items-center gap-1 cursor-pointer"
        >
          View all devices &rarr;
        </button>
      </div>
    </div>
  );
}
