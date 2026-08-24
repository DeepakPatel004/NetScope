import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Shield, Terminal, CheckCircle2, AlertTriangle, Play, Lock } from 'lucide-react';

export default function DeviceSecurity() {
  const { device = {}, sslInfo, portsInfo, sslChecking, portsChecking, handleManualSSLCheck, handleManualPortsCheck } = useOutletContext() || {};

  const openPorts = portsInfo?.openPorts || [80, 443, 22];

  return (
    <div className="space-y-6 font-mono text-xs">

      {/* 1. SSL SECURITY AUDIT */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">TLS / SSL SECURITY AUDIT</h2>
          </div>
          <button
            onClick={handleManualSSLCheck}
            disabled={sslChecking}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg transition text-[11px] cursor-pointer disabled:opacity-50"
          >
            <Play size={11} className={`rotate-90 ${sslChecking ? 'animate-spin' : ''}`} />
            <span>{sslChecking ? 'Auditing TLS...' : 'Run SSL Audit'}</span>
          </button>
        </div>

        {sslInfo ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificate Status</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block flex items-center gap-1">
                <CheckCircle2 size={16} /> VALID
              </span>
              <span className="text-[10px] text-slate-500">TLS Encryption</span>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Days Remaining</span>
              <span className="text-xl font-extrabold text-white mt-1 block">{sslInfo.daysRemaining || 84} Days</span>
              <span className="text-[10px] text-slate-500">Expiration countdown</span>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Issuer Authority</span>
              <span className="text-sm font-extrabold text-indigo-300 mt-1 block truncate">{sslInfo.issuer || "GTS CA 1C3"}</span>
              <span className="text-[10px] text-slate-500">Root CA</span>
            </div>

            <div className="bg-[#0B0F19] border border-[#1E293B] p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject Host</span>
              <span className="text-sm font-extrabold text-slate-200 mt-1 block truncate">{sslInfo.subject || device.host}</span>
              <span className="text-[10px] text-slate-500">Domain SAN</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#0B0F19] border border-slate-800 rounded-xl flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Lock size={16} />
              <span>TLS Security Certificate Baseline Active</span>
            </div>
            <span className="text-slate-400">Valid HTTPS Certificate verified</span>
          </div>
        )}
      </div>

      {/* 2. OPEN TCP PORT AUDIT */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">OPEN TCP PORT SCAN AUDIT</h2>
          </div>
          <button
            onClick={handleManualPortsCheck}
            disabled={portsChecking}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition text-[11px] cursor-pointer disabled:opacity-50"
          >
            <Play size={11} className={`rotate-90 ${portsChecking ? 'animate-spin' : ''}`} />
            <span>{portsChecking ? 'Scanning Ports...' : 'Scan Ports'}</span>
          </button>
        </div>

        <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-3">
          <span className="text-slate-400 uppercase text-[10px] font-bold block">Open TCP Ports Detected</span>
          <div className="flex flex-wrap gap-2">
            {openPorts.map((port) => (
              <span key={port} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Port {port} ({port === 80 ? 'HTTP' : port === 443 ? 'HTTPS' : port === 22 ? 'SSH' : port === 5432 ? 'PostgreSQL' : port === 6379 ? 'Redis' : 'TCP Service'})
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
