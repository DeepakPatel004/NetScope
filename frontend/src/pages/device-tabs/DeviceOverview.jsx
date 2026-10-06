import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Radio, Globe, CheckCircle2, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export default function DeviceOverview() {
  const {
    device,
    analytics,
    healthHistory = [],
    probeMatrix = [],
    locationResults = [],
    incidents = [],
    checking,
    handleManualCheck,
  } = useOutletContext();

  const latest = healthHistory[0];
  const active = incidents.filter(i => i.status !== 'RESOLVED');

  const metrics = [
    ['Status', latest?.status || 'Unknown'],
    ['Response Time', latest?.latency == null ? '—' : `${latest.latency} ms`],
    ['Uptime · 24h', analytics?.uptimePercentage != null ? `${analytics.uptimePercentage}%` : '—'],
    ['Open Incidents', active.length],
  ];

  return (
    <div className="space-y-6 text-xs text-slate-200">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#2b3036] bg-[#181b1f] p-5">
            <p className="text-slate-400 font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-3 tabular-nums ${
              label === 'Status' ? (value === 'UP' ? 'text-emerald-400' : 'text-rose-400') : 'text-white'
            }`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Multi-Probe Location Vantage Matrix */}
      <section className="rounded-xl border border-[#2b3036] bg-[#181b1f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2b3036] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Radio size={16} className="text-teal-400" /> Endpoint-by-Location Vantage Matrix
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Independent observations across distributed regional monitoring probes
            </p>
          </div>
          <button
            disabled={checking}
            onClick={handleManualCheck}
            className="rounded-lg bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
          >
            {checking ? 'Queueing…' : 'Run Check Now'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2b3036] bg-[#141618] text-slate-400">
                <th className="px-5 py-3 font-medium">Probe Location</th>
                <th className="px-5 py-3 font-medium">Region</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total Latency</th>
                <th className="px-5 py-3 font-medium">DNS</th>
                <th className="px-5 py-3 font-medium">TCP</th>
                <th className="px-5 py-3 font-medium">TLS</th>
                <th className="px-5 py-3 font-medium">TTFB</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Last Observed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3036]/50">
              {probeMatrix.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-slate-500">
                    No multi-probe observations recorded yet. Probes will report observations on their next schedule cycle.
                  </td>
                </tr>
              ) : (
                probeMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {item.probeName || item.probeId}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300">
                        <Globe size={11} className="text-teal-400" />
                        {item.region || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        item.status === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {item.status === 'UP' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white tabular-nums">
                      {item.latency != null ? `${item.latency} ms` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 tabular-nums">{item.dnsTime != null ? `${item.dnsTime} ms` : '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400 tabular-nums">{item.tcpTime != null ? `${item.tcpTime} ms` : '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400 tabular-nums">{item.tlsTime != null ? `${item.tlsTime} ms` : '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400 tabular-nums">{item.ttfbTime != null ? `${item.ttfbTime} ms` : '—'}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                      {item.failureStage || (item.status === 'UP' ? 'OK' : 'UNKNOWN')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {item.observedAt ? new Date(item.observedAt).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Open Incidents Box */}
      {active.length > 0 && (
        <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <ShieldAlert size={16} /> Active Incident Detected
          </div>
          {active.map(incident => (
            <Link
              key={incident.id}
              to={`/incidents?id=${incident.id}`}
              className="block rounded-lg border border-[#2b3036] bg-[#181b1f] p-4 text-xs hover:border-slate-600 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-400 uppercase tracking-wide">
                  {incident.assessment || incident.type || 'INCIDENT'}
                </span>
                <span className="text-slate-400 font-mono">Priority: {incident.priority}</span>
              </div>
              <p className="text-slate-300 mt-2">{incident.summary || incident.error}</p>
            </Link>
          ))}
        </section>
      )}

      {/* Target Configuration Info */}
      <section className="rounded-xl border border-[#2b3036] bg-[#181b1f] p-5">
        <h3 className="font-semibold text-white mb-3">Monitor Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-400 text-xs">
          <div>
            <span className="block text-slate-500 text-[11px]">Check Interval</span>
            <span className="text-white font-medium">{device.interval} seconds</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[11px]">Request Timeout</span>
            <span className="text-white font-medium">{device.timeoutMs || 10000} ms</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[11px]">Baseline Latency</span>
            <span className="text-white font-medium">{device.baselineLatency ? `${device.baselineLatency} ms` : 'Uncalibrated'}</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[11px]">State</span>
            <span className={`font-medium ${device.enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {device.enabled ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
