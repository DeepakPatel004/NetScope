import { Server, Activity, ShieldAlert, Clock } from 'lucide-react';

export default function KPICards({ devices = [], incidents = [], loading = false }) {
  const healthy = devices.filter(device => device.status === 'UP').length;
  const active = incidents.filter(incident => incident.status !== 'RESOLVED').length;
  const latencies = devices.filter(device => device.status === 'UP').map(device => device.latency).filter(value => typeof value === 'number' && Number.isFinite(value));
  const items = [
    ['Devices', devices.length, 'Registered in your workspace', Server],
    ['Online', `${healthy} / ${devices.length}`, 'Latest recorded health check', Activity],
    ['Open incidents', active, active ? 'Review incidents requiring attention' : 'No open incidents recorded', ShieldAlert],
    ['Average latency', latencies.length ? `${Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)} ms` : '—', 'Latest successful checks', Clock],
  ];
  return <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{items.map(([label, value, hint, Icon]) => <div key={label} className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-5"><div className="flex items-center justify-between text-slate-600"><p className="text-sm">{label}</p><Icon size={16} /></div><p className="text-3xl font-semibold tracking-tight text-slate-900 mt-5 tabular-nums">{loading ? '—' : value}</p><p className="text-xs text-slate-500 mt-2">{hint}</p></div>)}</div>;
}
