import React from 'react';
import { Settings as SettingsIcon, Clock, ShieldAlert, Database, HelpCircle, Bell, Layers, Sparkles } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="rounded-[30px] border border-slate-800/80 bg-slate-900/80 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
                <SettingsIcon size={18} className="text-indigo-300" />
                System Settings · NetScope v3
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
                Global monitoring defaults for your network.
              </h1>
              <p className="mt-4 max-w-2xl text-slate-400 leading-7 text-xs">
                Manage NetScope platform-wide defaults for polling, alerting, and data retention. These settings apply to all devices and will be extended with custom user-level controls in future releases.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-auto">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Release</p>
                <p className="mt-2 font-semibold text-white">v3.0.0</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mode</p>
                <p className="mt-2 font-semibold text-white">System-wide defaults</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-100 mb-4">
                <HelpCircle size={20} className="text-indigo-300" />
                <h2 className="text-base font-semibold">About this page</h2>
              </div>
              <p className="text-xs leading-6 text-slate-400">
                These settings control how NetScope monitors hosts and reports status across your entire account. For now, defaults are engine-level, but we are preparing more granular per-device and per-user preferences soon.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-500/10 p-3 text-emerald-300 mb-4">
                  <Clock size={20} />
                </div>
                <h3 className="font-semibold text-slate-200">Monitoring interval</h3>
                <p className="mt-2 text-xs text-slate-400 leading-5">
                  How often NetScope checks each registered host for health and latency.
                </p>
                <div className="mt-6 flex items-center justify-between rounded-3xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-xs text-slate-300">
                  <span>Default</span>
                  <span className="font-semibold text-white">1 minute</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-amber-500/10 p-3 text-amber-300 mb-4">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="font-semibold text-slate-200">Timeout threshold</h3>
                <p className="mt-2 text-xs text-slate-400 leading-5">
                  Server response timeout before a check is marked as failed.
                </p>
                <div className="mt-6 flex items-center justify-between rounded-3xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-xs text-slate-300">
                  <span>Default</span>
                  <span className="font-semibold text-white">5 seconds</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
              <div className="flex items-center gap-3 text-slate-100 mb-4">
                <Layers size={20} className="text-cyan-300" />
                <h2 className="text-base font-semibold">Retention and reporting</h2>
              </div>
              <p className="text-xs leading-6 text-slate-400">
                Data retention settings determine how much history is stored for checks, SSL inspections, and port scans. This is useful for troubleshooting and compliance.
              </p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-4 py-4 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>History limit</span>
                    <span className="font-semibold text-white">50 checks</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Recent monitoring results kept per device.</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-4 py-4 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>SSL alerts</span>
                    <span className="font-semibold text-white">Enabled</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Certificate expiry warnings are active for all devices.</p>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
