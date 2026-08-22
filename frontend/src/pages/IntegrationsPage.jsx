import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';

export default function IntegrationsPage() {
  const integrations = [
    { name: 'Slack Webhooks', category: 'Alerting', status: 'Connected', desc: 'Dispatch instant downtime & incident alerts to #sre-alerts channel' },
    { name: 'PagerDuty', category: 'Incident Management', status: 'Available', desc: 'Sync active incidents and trigger on-call phone escalations' },
    { name: 'Datadog Agent', category: 'Metrics Export', status: 'Available', desc: 'Forward NetScope anomaly telemetry streams to Datadog APM' },
    { name: 'Google Gemini LLM', category: 'AI Intelligence', status: 'Connected', desc: 'Powering automated root-cause analysis and incident summaries' },
  ];

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="border-b border-[#1E293B] pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Layers size={24} className="text-indigo-400" />
          Integrations & Extensions
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Connect NetScope with your alerting webhooks, on-call systems, and AI models
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{item.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                item.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">{item.desc}</p>
            <span className="text-[11px] font-mono text-indigo-400">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
