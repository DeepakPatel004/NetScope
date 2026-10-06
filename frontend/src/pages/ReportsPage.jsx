import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import api from '../services/api.js';

export default function ReportsPage() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/reports', { signal: controller.signal }).then(response => setReport(response.data.data)).catch(error => {
      if (error.code !== 'ERR_CANCELED') setError('Could not load the report. Please refresh to retry.');
    });
    return () => controller.abort();
  }, []);
  const download = async format => {
    setDownloading(true);
    try {
      const response = await api.get(`/reports/${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url; link.download = `netscope-report.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Report exported.');
    } catch { toast.error('Could not export the report. Please retry.'); }
    finally { setDownloading(false); }
  };
  return <div className="max-w-7xl mx-auto p-5 sm:p-8 space-y-7 text-slate-100">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2b3036] pb-6"><div><h1 className="text-2xl font-semibold">Reports</h1><p className="text-sm text-slate-400 mt-2">Latest 50 target observations per monitor, plus available probe TLS evidence.</p></div><div className="flex gap-2">{['csv', 'pdf'].map(format => <button key={format} disabled={!report || downloading} onClick={() => download(format)} className="flex items-center gap-2 border border-[#2b3036] bg-[#181b1f] rounded-lg px-3 py-2 text-sm disabled:opacity-50"><Download size={15} />Export {format.toUpperCase()}</button>)}</div></header>
    {error && <p role="alert" className="text-rose-300">{error}</p>}
    {!report && !error && <p role="status" className="text-slate-400">Loading report…</p>}
    {report && <><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[['Devices', report.summary.totalDevices], ['Online', report.summary.availability.online], ['Average uptime', report.summary.overallUptime === null ? '—' : `${report.summary.overallUptime}%`], ['Average latency', `${report.summary.averageLatency} ms`]].map(([label, value]) => <div key={label} className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-5"><p className="text-sm text-slate-400">{label}</p><p className="text-2xl font-semibold mt-3">{value}</p></div>)}</div><p className="text-xs text-slate-500">Generated {new Date(report.summary.generatedAt).toLocaleString()}. Uptime is calculated from recorded samples, not a guaranteed SLA.</p><div className="overflow-x-auto rounded-xl border border-[#2b3036] bg-[#181b1f]"><table className="w-full text-left text-sm"><thead className="text-slate-400 border-b border-[#2b3036]"><tr>{['Device', 'Last check', 'Uptime', 'Latency', 'Certificate'].map(label => <th key={label} className="p-4 font-medium">{label}</th>)}</tr></thead><tbody>{report.devices.map(device => <tr key={device.deviceId} className="border-b border-[#2b3036] last:border-0"><td className="p-4">{device.name}<p className="text-xs text-slate-500 mt-1">{device.host}</p></td><td className="p-4">{device.availability}</td><td className="p-4">{device.uptimePercentage === null ? '—' : `${device.uptimePercentage}%`}</td><td className="p-4">{device.latestLatency === null ? '—' : `${device.latestLatency} ms`}</td><td className="p-4">{device.sslStatus}</td></tr>)}</tbody></table>{!report.devices.length && <p className="p-10 text-center text-slate-500">Add a device to start collecting report data.</p>}</div></>}
  </div>;
}
