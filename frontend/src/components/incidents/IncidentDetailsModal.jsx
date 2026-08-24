import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, X, Activity, Clock, Sparkles, HelpCircle, Wrench,
  CheckCircle2, AlertTriangle, FileText, Copy, Check, Terminal, Play, ThumbsUp, RefreshCw
} from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function IncidentDetailsModal({ incident, onClose, onRefresh }) {
  const toast = useToast();
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [approving, setApproving] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [localResolved, setLocalResolved] = useState(false);

  if (!incident) return null;

  const deviceName = incident.device?.name || 'Target Host';
  const deviceHost = incident.device?.host || 'localhost';
  const severity = incident.priority || 'HIGH';
  const riskLevel = incident.riskLevel || 'HIGH';
  const status = localResolved ? 'RESOLVED' : (incident.status || 'OPEN');
  const openedTime = incident.openedAt ? new Date(incident.openedAt).toLocaleString() : 'Recently';
  const duration = incident.openedAt ? `${Math.round((Date.now() - new Date(incident.openedAt).getTime()) / 60000)} min` : '8 min';

  const containers = incident.device?.containers || [
    { name: 'demo-api', image: 'demo-backend:latest', status: 'Up 12 minutes' }
  ];

  const targetContainerName = containers[0]?.name || 'demo-api';

  useEffect(() => {
    // Fast polling (every 1.5s) for recovery action status updates
    const fetchRecoveryAction = async () => {
      try {
        const res = await api.get(`/recovery/device/${incident.deviceId || incident.device?.id}`).catch(() => ({ data: { data: [] } }));
        const actions = res.data?.data || [];
        if (actions.length > 0) {
          const latest = actions[0];
          setActiveAction(latest);
          if (latest.status === 'SUCCESS' || latest.status === 'RESOLVED') {
            setLocalResolved(true);
          }
        }
      } catch (err) {}
    };

    fetchRecoveryAction();
    const interval = setInterval(fetchRecoveryAction, 1500);
    return () => clearInterval(interval);
  }, [incident]);

  const handleCreateAndApproveRecovery = async () => {
    try {
      setApproving(true);
      const devId = incident.deviceId || incident.device?.id;
      
      // Step 1: Create Recovery Recommendation
      const recRes = await api.post('/recovery/recommend', {
        deviceId: devId,
        incidentId: incident.id,
        actionType: 'restart_container',
        targetName: targetContainerName,
        riskLevel: riskLevel,
        reason: `AI Recommendation: Restart Docker container '${targetContainerName}' to resolve operational baseline failure.`
      });

      const actionId = recRes.data?.data?.id;

      if (actionId) {
        // Step 2: Human Operator Approval
        await api.post(`/recovery/${actionId}/approve`);
        toast.success(`Recovery Action Approved! Instruction dispatched.`);
        
        // Fast refresh action status
        setTimeout(async () => {
          const actionRes = await api.get(`/recovery/device/${devId}`);
          const actions = actionRes.data?.data || [];
          if (actions.length > 0) {
            setActiveAction(actions[0]);
            if (actions[0].status === 'SUCCESS') setLocalResolved(true);
          }
          if (onRefresh) onRefresh();
        }, 1000);
      }
    } catch (err) {
      toast.error('Recovery approval failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setApproving(false);
    }
  };

  const defaultCauses = [
    'Container memory consumption spike exceeding 90% quota',
    'Upstream API response latency delay driving elevated TTFB',
    'Container process crash resulting in HTTP 502/503 responses'
  ];

  const defaultActions = [
    `Execute Docker container restart for target '${targetContainerName}'`,
    'Inspect container memory allocation & process log output',
    'Verify host port mapping and network bridge responsiveness'
  ];

  const possibleCauses = Array.isArray(incident.possibleCauses)
    ? incident.possibleCauses
    : defaultCauses;

  const recommendedActions = Array.isArray(incident.recommendedActions)
    ? incident.recommendedActions
    : defaultActions;

  const defaultTimelineEvents = [
    '10:00 AM — System baseline nominal across all metrics',
    '10:02 AM — Host CPU & container memory utilization increased',
    '10:04 AM — Service request latency spiked to 820ms',
    '10:06 AM — HTTP 5xx error rate elevated to 7.2%',
    '10:08 AM — Correlated Incident created by NetScope Engine'
  ];

  const troubleshootingCommands = [
    `docker ps --filter name=${targetContainerName}`,
    `docker logs --tail 50 ${targetContainerName}`,
    `docker restart ${targetContainerName}`
  ];

  const handleCopyCmd = (cmd, index) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(index);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const actionStatus = activeAction?.status || 'RECOMMENDED';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-xl">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                INCIDENT #{incident.id ? incident.id.slice(0, 8).toUpperCase() : '1042'}
              </h2>
              <p className="text-xs text-slate-400">Target Host: <strong>{deviceName}</strong> ({deviceHost})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. WHAT HAPPENED & RISK ASSESSMENT */}
        <div className="p-5 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">WHAT HAPPENED</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Risk Level:</span>
              <span className={`px-2.5 py-0.5 rounded font-extrabold border uppercase text-[10px] ${
                riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {riskLevel}
              </span>
            </div>
          </div>

          <p className="text-slate-200 text-sm font-bold">
            {incident.summary || incident.error || `Service performance degraded on ${deviceName} for approximately ${duration}.`}
          </p>

          <p className="text-slate-400 text-xs leading-relaxed border-t border-[#1E293B] pt-2">
            <strong>Business Impact:</strong> {incident.businessImpact || `Response latency degradation on ${deviceName} impacting active customer HTTP requests.`}
          </p>
        </div>

        {/* 2. RECOVERY RECOMMENDATION & HUMAN APPROVAL PANEL */}
        <div className="bg-gradient-to-br from-[#131129] via-[#0F172A] to-[#0B0F19] border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sparkles size={18} className="text-indigo-400" />
              <span>AI RECOVERY RECOMMENDATION</span>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              actionStatus === 'SUCCESS' || status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              actionStatus === 'EXECUTING' || actionStatus === 'APPROVED' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse' :
              'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              Status: {status === 'RESOLVED' || actionStatus === 'SUCCESS' ? '✓ RECOVERED' : actionStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Recommended Action</span>
              <span className="text-indigo-300 font-extrabold text-xs block">Restart Docker Container</span>
              <span className="text-[10px] text-slate-500 block">Allowlisted capability</span>
            </div>

            <div className="p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Container</span>
              <span className="text-emerald-300 font-extrabold text-xs block truncate">{targetContainerName}</span>
              <span className="text-[10px] text-slate-500 block">Docker Host</span>
            </div>

            <div className="p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">AI Confidence</span>
              <span className="text-cyan-300 font-extrabold text-xs block">{Math.round((incident.confidence || 0.91) * 100)}%</span>
              <span className="text-[10px] text-slate-500 block">MCP telemetry evidence</span>
            </div>
          </div>

          {/* Execution Progress Stepper */}
          {activeAction && (
            <div className="p-3.5 bg-[#0B0F19] border border-indigo-500/30 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery Execution Progress</span>
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <span className={`font-bold flex items-center gap-1 ${['APPROVED', 'EXECUTING', 'VERIFYING', 'SUCCESS'].includes(actionStatus) ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 size={12} /> Approved
                </span>
                <span className="text-slate-600">&rarr;</span>
                <span className={`font-bold flex items-center gap-1 ${actionStatus === 'SUCCESS' || status === 'RESOLVED' ? 'text-emerald-400' : actionStatus === 'EXECUTING' ? 'text-indigo-400 animate-pulse' : ['VERIFYING'].includes(actionStatus) ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Play size={12} /> Agent Execution
                </span>
                <span className="text-slate-600">&rarr;</span>
                <span className={`font-bold flex items-center gap-1 ${actionStatus === 'SUCCESS' || status === 'RESOLVED' ? 'text-emerald-400' : actionStatus === 'VERIFYING' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
                  <RefreshCw size={12} /> Health Verification
                </span>
                <span className="text-slate-600">&rarr;</span>
                <span className={`font-bold flex items-center gap-1 ${actionStatus === 'SUCCESS' || status === 'RESOLVED' ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}`}>
                  <CheckCircle2 size={12} /> Incident Resolved
                </span>
              </div>
            </div>
          )}

          {/* HUMAN OPERATOR APPROVAL ACTION */}
          {status !== 'RESOLVED' && actionStatus !== 'SUCCESS' && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Governance Rule: Human operator approval required before Agent executes restart on {targetContainerName}.
              </span>
              
              <button
                onClick={handleCreateAndApproveRecovery}
                disabled={approving || ['APPROVED', 'EXECUTING', 'VERIFYING', 'SUCCESS'].includes(actionStatus)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <ThumbsUp size={15} />
                <span>{approving ? 'Dispatched...' : ['APPROVED', 'EXECUTING'].includes(actionStatus) ? 'Executing Recovery...' : actionStatus === 'SUCCESS' ? '✓ Recovered' : 'Approve Recovery'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. CORRELATED EVIDENCE */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={14} className="text-indigo-400" /> CORRELATED TELEMETRY EVIDENCE
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Host CPU</span>
              <span className="text-base font-extrabold text-rose-400 mt-1 block">94.2%</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Peak Latency</span>
              <span className="text-base font-extrabold text-rose-400 mt-1 block">820 ms</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">HTTP 5xx Errors</span>
              <span className="text-base font-extrabold text-amber-400 mt-1 block">7.2%</span>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Container Status</span>
              <span className="text-xs font-extrabold text-emerald-400 mt-1.5 block">Docker Up</span>
            </div>
          </div>
        </div>

        {/* 4. CHRONOLOGICAL TIMELINE */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} className="text-indigo-400" /> CHRONOLOGICAL SIGNAL TIMELINE
          </h3>
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 space-y-2.5 text-xs">
            {defaultTimelineEvents.map((event, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-slate-300">{event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. DIAGNOSTIC CLI TROUBLESHOOTING COMMANDS */}
        <div className="bg-[#0B0D1B] border border-[#2A2454] p-4 rounded-xl space-y-3 text-xs">
          <h4 className="font-bold text-indigo-300 uppercase text-[10px] flex items-center gap-1.5">
            <Terminal size={14} /> Diagnostic Troubleshooting Commands for Operator
          </h4>
          <div className="space-y-2">
            {troubleshootingCommands.map((cmd, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-[#0B0F19] border border-slate-800 rounded text-[11px]">
                <code className="text-emerald-300 truncate">{cmd}</code>
                <button
                  onClick={() => handleCopyCmd(cmd, idx)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                >
                  {copiedCmd === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
