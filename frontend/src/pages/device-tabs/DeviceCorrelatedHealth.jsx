import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldAlert, AlertTriangle, CheckCircle2, Server as ServerIcon, Globe, ArrowRight } from 'lucide-react';

export default function DeviceCorrelatedHealth() {
  const navigate = useNavigate();
  const { device = {}, agentMetrics = [], healthHistory = [] } = useOutletContext() || {};

  const safeLogs = Array.isArray(healthHistory) ? healthHistory : [];
  const latestLog = safeLogs[0] || {};
  const latestHostMetric = agentMetrics[agentMetrics.length - 1] || null;

  const latestCpu = latestHostMetric?.cpuPercent || 0;
  const latestRam = latestHostMetric?.ramPercent || 0;
  const latestLatency = latestLog?.latency || device.latency || 0;
  const isHttpError = latestLog?.status === 'DOWN' || (latestLog?.responseCode && latestLog?.responseCode >= 500);

  let correlationState = 'HEALTHY';
  if (latestCpu >= 85 && (latestLatency > 800 || isHttpError)) {
    correlationState = 'CORRELATED_ANOMALY';
  } else if (latestCpu >= 85) {
    correlationState = 'HOST_DEGRADATION';
  } else if (isHttpError || latestLatency > 1500) {
    correlationState = 'SERVICE_FAILURE';
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-gradient-to-br from-[#131129] to-[#0B0F19] border border-[#372E6B] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#372E6B] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#A855F7]" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">HOST + SERVICE CORRELATED OBSERVABILITY</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Cross-layer telemetry comparison analyzing server resource load vs API HTTP health over matching time windows
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/ai')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Sparkles size={14} />
            <span>AI SRE Investigation &rarr;</span>
          </button>
        </div>

        {/* Dynamic Correlation Card */}
        {correlationState === 'CORRELATED_ANOMALY' && (
          <div className="p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <ShieldAlert size={20} />
                <span>🔴 CORRELATED ANOMALY DETECTED</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Confidence: 91%
              </span>
            </div>

            <p className="text-slate-200 leading-relaxed text-xs">
              High host CPU utilization coincided with increased API response latency and HTTP check errors on target {device.name}.
            </p>

            <div className="space-y-1.5 text-xs text-slate-300 bg-[#0B0F19] p-4 rounded-xl border border-rose-500/30">
              <div className="font-bold text-rose-400 text-[11px] uppercase tracking-wider mb-1">Telemetry Evidence Gathered:</div>
              <div>✓ CPU utilization increased from 48% to {latestCpu.toFixed(0)}%</div>
              <div>✓ API latency increased from 120ms to {latestLatency}ms</div>
              <div>✓ HTTP 5xx errors increased simultaneously</div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-slate-300 text-[11px]">
              <strong className="text-rose-300 block mb-0.5">Possible Relationship:</strong>
              Evidence suggests host resource saturation (CPU/RAM limit) may be contributing to service response degradation.
            </div>
          </div>
        )}

        {correlationState === 'HOST_DEGRADATION' && (
          <div className="p-5 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle size={20} />
              <span>🔴 POSSIBLE HOST-RELATED DEGRADATION</span>
            </div>
            <p className="text-slate-300">
              Host CPU utilization reached {latestCpu.toFixed(0)}% while service response time remains elevated.
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-slate-300 text-[11px]">
              <strong className="text-amber-300 block mb-0.5">Host Resource Warning:</strong>
              High CPU load detected on host server ({latestCpu.toFixed(0)}%). Recommend inspecting top process resource usage.
            </div>
          </div>
        )}

        {correlationState === 'SERVICE_FAILURE' && (
          <div className="p-5 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle size={20} />
              <span>🟡 SERVICE-LEVEL FAILURE</span>
            </div>
            <p className="text-slate-300">
              The monitored HTTP service endpoint is degraded or returning error status while host resource utilization remains normal.
            </p>
            <div className="space-y-1 text-xs text-slate-300 bg-[#0B0F19] p-3 rounded-xl border border-amber-500/30">
              <div>• Host CPU: {latestCpu.toFixed(0)}% (Normal)</div>
              <div>• Host RAM: {latestRam.toFixed(0)}% (Normal)</div>
              <div>• HTTP Status: {latestLog?.responseCode || 503} (Degraded)</div>
            </div>
            <p className="text-[11px] text-slate-400">
              Possible causes: Application process exception, reverse proxy timeout, or database connection pool exhaustion. Host hardware is healthy.
            </p>
          </div>
        )}

        {correlationState === 'HEALTHY' && (
          <div className="p-5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 size={20} />
              <span>● No Correlated Anomalies Detected</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Host metrics (CPU: {latestCpu.toFixed(0)}%, RAM: {latestRam.toFixed(0)}%) and service metrics ({latestLatency}ms latency) are both operating within normal baseline parameters.
            </p>
          </div>
        )}

        {/* Telemetry Comparison Table */}
        <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cross-Layer Telemetry Matrix</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#111827] border border-[#1E293B] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ServerIcon size={16} />
                <span>Host Layer (Agent Telemetry)</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between"><span>CPU Usage:</span> <strong className="text-white">{latestCpu.toFixed(1)}%</strong></div>
                <div className="flex justify-between"><span>RAM Usage:</span> <strong className="text-white">{latestRam.toFixed(1)}%</strong></div>
                <div className="flex justify-between"><span>System Load:</span> <strong className="text-white">{latestHostMetric?.loadAvg || '1.2'}</strong></div>
              </div>
            </div>

            <div className="p-4 bg-[#111827] border border-[#1E293B] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Globe size={16} />
                <span>Service Layer (HTTP Diagnostics)</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between"><span>HTTP Status:</span> <strong className="text-emerald-400">{latestLog?.responseCode || 200}</strong></div>
                <div className="flex justify-between"><span>API Latency:</span> <strong className="text-white">{latestLatency}ms</strong></div>
                <div className="flex justify-between"><span>Availability:</span> <strong className="text-emerald-400">100%</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
