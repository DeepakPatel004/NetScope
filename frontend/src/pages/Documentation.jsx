import React from 'react';
import { BookOpen, Server, Terminal, Shield, Zap, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

export default function Documentation() {
  const toast = useToast();
  const [copiedCmd, setCopiedCmd] = useState(false);

  const sampleCmd = `python agent/agent.py --server=http://localhost:5000 --key=YOUR_AGENT_KEY`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCmd);
    setCopiedCmd(true);
    toast.success('Agent command copied!');
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="p-8 md:p-10 bg-[#0B0F19] min-h-screen text-slate-100 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
              PLATFORM DOCUMENTATION & AGENT SETUP GUIDE
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Learn how NetScope Agent streams host telemetry and correlates cross-signal incidents with AI
          </p>
        </div>
      </div>

      {/* SECTION 1: NETSCOPE AGENT SETUP */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl font-mono text-xs">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Server size={18} className="text-indigo-400" /> 01 / NetScope Agent Installation Guide
        </h2>

        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          The NetScope Agent is a lightweight Python executable designed to run on target server hosts. It collects CPU %, RAM %, Disk %, System Load, and systemd service status every 15 seconds without root privileges.
        </p>

        <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-3">
          <span className="text-slate-400 font-bold uppercase text-[11px] block">Installation Command</span>
          <div className="p-3 bg-[#030712] border border-indigo-500/30 rounded-lg text-emerald-300 font-mono text-xs flex items-center justify-between gap-4">
            <code className="truncate">{sampleCmd}</code>
            <button
              onClick={handleCopy}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition cursor-pointer shrink-0"
            >
              {copiedCmd ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: CORE OBSERVABILITY ARCHITECTURE */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl font-mono text-xs">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Zap size={18} className="text-emerald-400" /> 02 / 3-State Signal Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          <div className="p-5 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-2">
            <span className="text-amber-400 font-bold text-sm block">01. Telemetry Anomaly (🟡)</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolated metric spikes (e.g. temporary latency variation) recorded without alert noise.
            </p>
          </div>

          <div className="p-5 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-2">
            <span className="text-rose-400 font-bold text-sm block">02. Incident State (🔴)</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Debounced, persistent operational problems correlating host load with service delays.
            </p>
          </div>

          <div className="p-5 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-2">
            <span className="text-purple-400 font-bold text-sm block">03. AI Investigation (🔵)</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Grounded SRE evidence analysis explaining likely causes and safe operator recommendations.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
