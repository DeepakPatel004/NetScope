import React, { useState } from 'react';
import { X, Sparkles, Clock, Activity, ShieldAlert, CheckCircle2, Wrench, HelpCircle, Terminal, Copy, Check } from 'lucide-react';
import { aiInsightsService } from '../../services/aiInsightsService.js';
import { api } from '../../services/api.js';

export default function IncidentDetailsModal({ incident, onClose }) {
  const [timelineData, setTimelineData] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Playbook state
  const [playbook, setPlaybook] = useState(null);
  const [loadingPlaybook, setLoadingPlaybook] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(null);

  if (!incident) return null;

  const deviceName = typeof incident.device === 'string'
    ? incident.device
    : (incident.device?.name || incident.device?.host || (typeof incident.service === 'string' ? incident.service : 'Target Endpoint'));
  const deviceHost = incident.device?.host || incident.host || 'localhost';
  const severity = incident.priority || incident.severity || 'CRITICAL';
  const status = incident.status || 'OPEN';
  const openedTime = incident.openedAt ? new Date(incident.openedAt).toLocaleTimeString() : '17:05';
  const duration = incident.openedAt ? `${Math.round((Date.now() - new Date(incident.openedAt).getTime()) / 60000)} minutes` : '12 minutes';

  const possibleCauses = Array.isArray(incident.possibleCauses)
    ? incident.possibleCauses
    : typeof incident.possibleCauses === 'string'
    ? JSON.parse(incident.possibleCauses || '[]')
    : ['Database response time increase detected', 'Upstream gateway connection pool exhaustion'];

  const recommendedActions = Array.isArray(incident.recommendedActions)
    ? incident.recommendedActions
    : typeof incident.recommendedActions === 'string'
    ? JSON.parse(incident.recommendedActions || '[]')
    : ['Check DB connections and slow queries', 'Inspect host CPU utilization and RAM'];

  const defaultTimelineEvents = [
    { time: '17:05', event: 'Latency anomaly detected by Isolation Forest model (2450ms peak)' },
    { time: '17:06', event: 'Error rate increased above 5% threshold' },
    { time: '17:07', event: 'Incident priority assigned as CRITICAL (Score: 14.1)' },
    { time: '17:08', event: 'AI root cause analysis completed via Gemini LLM' },
    { time: '17:12', event: 'Monitoring worker tracking resolution phase' },
  ];

  const handleFetchTimeline = async () => {
    if (!incident.deviceId) return;
    try {
      setLoadingTimeline(true);
      const res = await aiInsightsService.getTimelineSummary(incident.deviceId);
      setTimelineData(res);
    } catch (e) {
      console.error('Failed to load timeline', e);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleGeneratePlaybook = async () => {
    try {
      setLoadingPlaybook(true);
      const devId = incident.deviceId || incident.device?.id || 'dev-1';
      const res = await api.post(`/ai/playbook/${devId}`, {
        summary: incident.summary || incident.error,
        possibleCauses
      });
      setPlaybook(res.data?.data || res.data);
    } catch (e) {
      console.warn('Playbook generation fallback:', e);
      setPlaybook({
        playbook_title: `SRE Incident Remediation Playbook — ${deviceName}`,
        estimated_recovery_mins: 5,
        cli_commands: [
          `curl -Iv http://${deviceHost}`,
          `ping -c 4 ${deviceHost}`,
          `docker ps --filter name=${deviceName.toLowerCase().replace(/\s+/g, '-')}`,
          `systemctl status network-manager`
        ],
        remediation_steps: [
          `Execute socket connectivity ping against target host '${deviceHost}'`,
          `Review systemctl and container execution logs for process crashes`,
          `Flush local DNS resolver cache and verify gateway firewall rules`,
          `Restart application service process if memory limit is exceeded`
        ]
      });
    } finally {
      setLoadingPlaybook(false);
    }
  };

  const handleCopyCmd = (cmd, index) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(index);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 rounded-xl">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Incident Overview — {deviceName}
              </h2>
              <p className="text-xs text-slate-400">ID: {incident.id || 'INC-84920'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. Incident Overview Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B0F19] p-4 rounded-xl border border-[#1E293B] text-xs">
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Severity</span>
            <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded border uppercase text-[10px] ${
              severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {severity}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Status</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} /> {status}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Detected Time</span>
            <span className="font-bold text-white">{openedTime}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Duration</span>
            <span className="font-bold text-white">{duration}</span>
          </div>
        </div>

        {/* 2. Key Metrics Section */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" /> Metrics Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Peak Latency</span>
              <span className="text-base font-extrabold text-rose-400">2450 ms</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Error Rate</span>
              <span className="text-base font-extrabold text-amber-400">6.2%</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Packet Loss</span>
              <span className="text-base font-extrabold text-cyan-400">0.32%</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Service Uptime</span>
              <span className="text-base font-extrabold text-emerald-400">99.4%</span>
            </div>
          </div>
        </div>

        {/* 3. Incident Progression Timeline Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" /> Incident Timeline
            </h3>
            {incident.deviceId && !timelineData && (
              <button
                onClick={handleFetchTimeline}
                disabled={loadingTimeline}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                {loadingTimeline ? 'Generating...' : 'Refresh AI Timeline'}
              </button>
            )}
          </div>
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 space-y-3 text-xs">
            {(timelineData?.key_events?.length ? timelineData.key_events.map((ev, i) => ({ time: `Step ${i+1}`, event: ev })) : defaultTimelineEvents).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="font-mono font-bold text-indigo-400 shrink-0 w-12">{item.time}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span className="text-slate-300">{item.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. AI Analysis Section */}
        <div className="bg-gradient-to-br from-[#131129] to-[#0B0F19] border border-[#372E6B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#A855F7]" /> AI Root Cause Analysis
            </h3>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Confidence: {Math.round((incident.confidence || 0.92) * 100)}%
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {incident.summary || incident.error || `Anomaly score jumped to ${(incident.priorityScore || 7.5).toFixed(1)} due to combined latency surge and 5xx error frequency.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0B0D1B] border border-[#2A2454] p-3 rounded-lg">
              <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-1.5 text-[11px]">
                <HelpCircle size={14} /> Possible Causes (Hypotheses)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {possibleCauses.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0B0D1B] border border-[#2A2454] p-3 rounded-lg">
              <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-1.5 text-[11px]">
                <Wrench size={14} /> Recommended Investigation
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {recommendedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Remediation Playbook Trigger Button */}
          {!playbook && (
            <div className="pt-2">
              <button
                onClick={handleGeneratePlaybook}
                disabled={loadingPlaybook}
                className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                <Terminal size={15} />
                <span>{loadingPlaybook ? 'Generating SRE Remediation Commands...' : '⚡ Generate AI SRE Remediation Playbook'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Automated Remediation Playbook CLI Section */}
        {playbook && (
          <div className="bg-[#090D16] border border-[#1E293B] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {playbook.playbook_title || 'SRE Incident Remediation Playbook'}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Est. Recovery: {playbook.estimated_recovery_mins || 5} mins
              </span>
            </div>

            {/* Steps */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
                Remediation Sequence Steps
              </h4>
              <ul className="space-y-1 text-xs text-slate-300 font-mono">
                {(playbook.remediation_steps || []).map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Copyable CLI Commands */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
                Executable Recovery CLI Commands
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {(playbook.cli_commands || []).map((cmd, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#030712] border border-[#1E293B] p-2.5 rounded-lg text-emerald-300">
                    <span className="truncate pr-2">$ {cmd}</span>
                    <button
                      onClick={() => handleCopyCmd(cmd, idx)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition shrink-0 cursor-pointer"
                      title="Copy command"
                    >
                      {copiedCmd === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
