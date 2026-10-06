import React from 'react';
import { X, Activity, ShieldAlert, CheckCircle2, AlertTriangle, Globe, HelpCircle, Radio } from 'lucide-react';

const assessmentBadgeStyle = (assessment) => {
  switch (assessment) {
    case 'WIDESPREAD_FAILURE':
      return 'bg-rose-500/15 border-rose-500/40 text-rose-400';
    case 'LOCATION_SPECIFIC_FAILURE':
      return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    case 'PROBE_CONNECTIVITY_SUSPECTED':
      return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
    case 'DNS_FAILURE':
      return 'bg-orange-500/15 border-orange-500/40 text-orange-300';
    case 'TLS_CERTIFICATE_FAILURE':
      return 'bg-pink-500/15 border-pink-500/40 text-pink-300';
    case 'LATENCY_DEGRADATION':
      return 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300';
    case 'INSUFFICIENT_EVIDENCE':
    default:
      return 'bg-slate-500/15 border-slate-500/40 text-slate-300';
  }
};

export default function IncidentDetailsModal({ incident, onClose }) {
  if (!incident) return null;

  const assessment = incident.assessment || 'INSUFFICIENT_EVIDENCE';
  const evidence = incident.supportingEvidence || incident.evidence || {};
  const uncertainties = Array.isArray(incident.uncertainties) ? incident.uncertainties : [];
  const probeVerdicts = Array.isArray(evidence.probeVerdicts) ? evidence.probeVerdicts : [];
  const controlVerdict = evidence.controlEndpointVerdict || null;
  const affectedLocations = Array.isArray(incident.affectedLocations)
    ? incident.affectedLocations
    : Array.isArray(evidence.affectedLocations)
    ? evidence.affectedLocations
    : [];

  const timeline = Array.isArray(incident.timeline) ? incident.timeline : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-title"
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-[#2b3036] bg-[#141618] p-6 text-slate-200 space-y-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-start gap-4 border-b border-[#2b3036] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide uppercase ${assessmentBadgeStyle(assessment)}`}>
                {assessment.replace(/_/g, ' ')}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                Stage: {incident.failedStage || evidence.diagnosticDetails?.stage || 'UNKNOWN'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                {incident.status}
              </span>
            </div>
            <h2 id="incident-title" className="text-lg font-bold text-white mt-3">
              {incident.device?.name || 'Monitored Target'}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {incident.device?.host || ''}
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </header>

        {/* Incident Summary */}
        <div className="rounded-lg bg-[#181b1f] border border-[#2b3036] p-4 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-white mb-1">Investigation Assessment Summary:</p>
          <p>{incident.summary || incident.error || 'No detailed assessment summary available.'}</p>
        </div>

        {/* Affected Locations Banner */}
        {affectedLocations.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Globe size={15} className="text-teal-400" />
            <span className="font-semibold text-white">Affected Observation Locations:</span>
            <div className="flex flex-wrap gap-1.5">
              {affectedLocations.map(loc => (
                <span key={loc} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-rose-300">
                  {loc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Independent Probe Observation Verdicts */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3">
            <Radio size={14} className="text-teal-400" /> Independent Probe Observations
          </h3>
          {probeVerdicts.length > 0 ? (
            <div className="rounded-lg border border-[#2b3036] bg-[#181b1f] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2b3036] bg-[#121416] text-slate-400">
                    <th className="px-4 py-2.5 font-medium">Probe Location</th>
                    <th className="px-4 py-2.5 font-medium">Region</th>
                    <th className="px-4 py-2.5 font-medium">Verdict</th>
                    <th className="px-4 py-2.5 font-medium">Latency</th>
                    <th className="px-4 py-2.5 font-medium">Failure Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b3036]/50">
                  {probeVerdicts.map((v, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-semibold text-white">{v.probeName || v.probeId}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono">{v.region || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 font-bold ${v.status === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {v.status === 'UP' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 tabular-nums">
                        {typeof v.latency === 'number' ? `${v.latency} ms` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {v.failureStage || 'NONE'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-[#2b3036] bg-[#181b1f] p-4 text-xs text-slate-500">
              No cross-location probe samples recorded for this incident yet.
            </div>
          )}
        </div>

        {/* Operator Control Endpoint Result */}
        {controlVerdict && (
          <div className="rounded-lg border border-[#2b3036] bg-[#181b1f] p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Operator Control Endpoint Benchmark</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${controlVerdict.status === 'UP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                Control Check: {controlVerdict.status || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-slate-400">
              {controlVerdict.status === 'UP'
                ? 'Reporting probe successfully reached control baseline. Egress network connectivity from probe host is verified healthy.'
                : 'Reporting probe also failed reaching operator control endpoint. Outage may be caused by probe connectivity failure rather than target degradation.'}
            </p>
          </div>
        )}

        {/* Documented Uncertainties (Honest System Boundaries) */}
        {uncertainties.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <HelpCircle size={14} /> Explicit Uncertainties & Investigation Scope:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
              {uncertainties.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Investigation Timeline */}
        {timeline.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity size={14} className="text-teal-400" /> Incident Timeline
            </h3>
            <div className="rounded-lg border border-[#2b3036] bg-[#181b1f] p-3 space-y-2 max-h-40 overflow-y-auto">
              {timeline.map((entry, index) => {
                const isObj = typeof entry === 'object' && entry !== null;
                const timeStr = isObj ? new Date(entry.timestamp).toLocaleTimeString() : '';
                const text = isObj ? entry.event : entry;
                return (
                  <div key={index} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="font-mono text-slate-500 shrink-0">{timeStr}</span>
                    <span>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
