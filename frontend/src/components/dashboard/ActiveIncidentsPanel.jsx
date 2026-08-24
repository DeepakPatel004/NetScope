import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const SEVERITY_BADGES = {
  CRITICAL: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
  HIGH: 'bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30',
  MEDIUM: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  LOW: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
};

export default function ActiveIncidentsPanel({ incidents = [], devices = [], onSelectIncident }) {
  const navigate = useNavigate();

  // Filter real open incidents for existing devices only
  const validIncidents = incidents.filter(i => i && (i.device || typeof i.service === 'string'));
  
  const displayList = devices.length === 0 
    ? []
    : validIncidents.length > 0
    ? validIncidents.slice(0, 3).map((i) => {
        const titleStr = typeof i.summary === 'string' ? i.summary : (i.error || 'Infrastructure Metric Degradation');
        const serviceStr = typeof i.service === 'string' ? i.service : (i.device?.name || i.device?.host || 'Monitored Service');
        return {
          id: i.id,
          severity: i.priority || i.severity || 'HIGH',
          title: titleStr,
          service: serviceStr,
          time: i.openedAt ? `${Math.round((Date.now() - new Date(i.openedAt).getTime()) / 60000)}m ago` : '5m ago',
          raw: i
        };
      })
    : devices.filter(d => d && d.status === 'DOWN').map(d => ({
        id: `inc-down-${d.id}`,
        severity: 'CRITICAL',
        title: 'Endpoint Connection Loss',
        service: d.name || d.host,
        time: d.lastChecked ? `${Math.round((Date.now() - new Date(d.lastChecked).getTime()) / 60000)}m ago` : 'Just now',
        raw: d
      }));

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          Active Incidents
          {displayList.length > 0 && (
            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
              {displayList.length} Active
            </span>
          )}
        </h3>
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-semibold text-[#818CF8] hover:text-indigo-300 transition cursor-pointer"
        >
          View all &rarr;
        </button>
      </div>

      {/* Incident List or Clean State */}
      {displayList.length > 0 ? (
        <div className="space-y-3 my-1">
          {displayList.map((item) => {
            const badgeStyle = SEVERITY_BADGES[item.severity] || SEVERITY_BADGES.MEDIUM;
            return (
              <div
                key={item.id}
                onClick={() => onSelectIncident && onSelectIncident(item.raw || item)}
                className="bg-[#0B0F19] border border-[#1E293B] hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeStyle}`}>
                    {item.severity}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{item.service}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0 font-medium">{item.time}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-1.5 border border-dashed border-[#1E293B] rounded-xl my-1">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">All Systems Operational</h4>
          <p className="text-[11px] text-slate-500 max-w-xs">Zero active infrastructure incidents detected.</p>
        </div>
      )}
    </div>
  );
}
