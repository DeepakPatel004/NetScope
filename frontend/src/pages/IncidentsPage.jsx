import React, { useState, useEffect } from 'react';
import { ShieldAlert, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import { aiInsightsService } from '../services/aiInsightsService.js';
import IncidentDetailsModal from '../components/incidents/IncidentDetailsModal.jsx';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setLoading(true);
        const list = await aiInsightsService.getActiveIncidents();
        setIncidents(list || []);
      } catch (e) {
        console.error('Failed to load active incidents', e);
      } finally {
        setLoading(false);
      }
    };
    loadIncidents();
  }, []);

  const filtered = filterSeverity === 'ALL'
    ? incidents
    : incidents.filter(i => (i.priority || i.severity) === filterSeverity);

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            Incidents & Security Alerts
            {filtered.length > 0 ? (
              <span className="text-xs font-bold px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center gap-1.5">
                <ShieldAlert size={12} /> {filtered.length} Active
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Systems Operational
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Prioritized infrastructure incidents with automated AI root cause diagnosis
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#111827] border border-[#1E293B] text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </div>

      {/* Incidents Table / List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const targetName = typeof item.device === 'string'
              ? item.device
              : (item.device?.name || item.device?.host || item.service || 'Target Host');
            const summaryText = typeof item.summary === 'string'
              ? item.summary
              : (item.error || 'Infrastructure Metric Degradation');

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIncident(item)}
                className="bg-[#111827] border border-[#1E293B] hover:border-[#6366F1]/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded border uppercase tracking-wider shrink-0 ${
                    (item.priority || item.severity) === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    (item.priority || item.severity) === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {item.priority || item.severity || 'HIGH'}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      {summaryText}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Affected Target: <strong className="text-slate-200">{targetName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="text-slate-400 font-mono">Priority Score: <strong className="text-indigo-400">{(item.priorityScore || 7.5).toFixed(1)}</strong></span>
                  <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition">
                    <span>View Diagnosis</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 bg-[#111827] border border-dashed border-[#1E293B] rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No Active Incidents Recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              All monitored infrastructure endpoints are operating within normal baseline parameters. Machine learning models continuously check for metric anomalies.
            </p>
          </div>
        </div>
      )}

      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}
