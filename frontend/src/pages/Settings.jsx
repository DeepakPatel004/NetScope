import React from 'react';
import { Settings as SettingsIcon, Clock, ShieldAlert, Database, HelpCircle } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-sm text-slate-400 mt-1">Configure and view system monitor defaults.</p>
          </div>
        </div>

        {/* Info Alert Box */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-4 mb-8 flex gap-3 items-start">
          <HelpCircle className="text-indigo-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">System-Wide Defaults (Version 1)</h4>
            <p className="text-xs text-slate-400 mt-1">
              For NetScope v1.0, settings are system-wide defaults managed by the background engine. User-configurable custom scheduling rules will become available in the next version update.
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Interval */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-4">
                <Clock size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-200">Monitoring Interval</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Frequency at which background workers test host health.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Default</span>
              <span className="text-2xl font-bold text-slate-100">1 Minute</span>
            </div>
          </div>

          {/* Card 2: Timeout */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl w-fit mb-4">
                <ShieldAlert size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-200">Request Timeout</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Maximum time allowed for a service response before flagging DOWN status.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Default</span>
              <span className="text-2xl font-bold text-slate-100">5 Seconds</span>
            </div>
          </div>

          {/* Card 3: Limit */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl w-fit mb-4">
                <Database size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-200">History Limit</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Maximum quantity of previous check logs retained per monitored device.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Default</span>
              <span className="text-2xl font-bold text-slate-100">50 Checks</span>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-350">NetScope Platform Version</h4>
            <p className="text-xs text-slate-500 mt-0.5">Running open-source daemon services.</p>
          </div>
          <div className="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-300">
            v1.0.0-release
          </div>
        </div>
      </div>
    </div>
  );
}
