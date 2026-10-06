import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api.js';

export default function LatencyOverviewChart({ devices = [], refreshKey }) {
  const [target, setTarget] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const deviceId = devices.some(device => device.id === target) ? target : devices[0]?.id;
  useEffect(() => {
    if (!deviceId) { setLogs([]); return; }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get(`/health/${deviceId}`, { signal: controller.signal }).then(response => {
      setLogs([...(response.data?.data || [])].reverse());
    }).catch(error => {
      if (error.code !== 'ERR_CANCELED') { setLogs([]); setError('Could not load response times.'); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [deviceId, refreshKey]);
  const data = logs.map(log => ({ time: new Date(log.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), latency: log.status === 'UP' ? log.latency : null }));
  return <section className="rounded-xl border border-[#2b3036] bg-[#181b1f] p-5 sm:p-6 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-white">Response time</h2><p className="text-xs text-slate-500 mt-1">Recent health checks · milliseconds</p></div><select aria-label="Response time device" value={deviceId || ''} onChange={event => setTarget(event.target.value)} className="max-w-full rounded-lg border border-[#2b3036] bg-[#101214] text-sm text-slate-300 p-2">{!devices.length && <option value="">No devices</option>}{devices.map(device => <option key={device.id} value={device.id}>{device.name}</option>)}</select></div>
    <div className="h-64">{loading ? <p role="status" className="text-sm text-slate-500 py-20 text-center">Loading response times…</p> : error || !data.length ? <p className="text-sm text-slate-500 py-20 text-center">{error || 'No health checks recorded yet.'}</p> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="#2b3036" vertical={false} /><XAxis dataKey="time" stroke="#8b949e" fontSize={11} minTickGap={35} tickLine={false} axisLine={false} /><YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#181b1f', border: '1px solid #2b3036', borderRadius: 8 }} /><Area type="linear" dataKey="latency" name="Latency (ms)" stroke="#2dd4bf" fill="#14b8a6" fillOpacity={0.08} strokeWidth={2} isAnimationActive={false} connectNulls={false} /></AreaChart></ResponsiveContainer>}</div>
  </section>;
}
