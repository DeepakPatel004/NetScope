import React, { useState, useEffect } from 'react';
import { ShieldAlert, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import IncidentDetailsModal from '../components/incidents/IncidentDetailsModal.jsx';
import api from '../services/api.js';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const incRes = await api.get('/incidents');
      const incList = (incRes.data?.data || []).filter(i => i.device !== null);
      setIncidents(incList);

      // Auto-open incident modal if redirected from email link (?id=INCIDENT_ID)
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('id');
      if (targetId && incList.length > 0) {
        const found = incList.find(i => i.id === targetId);
        if (found) {
          setSelectedIncident(found);
        }
      }
    } catch (e) {
      setError('Could not load incidents. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = incidents.filter(item => item.status !== 'RESOLVED').length;
  const filteredIncidents = filterSeverity === 'ALL'
    ? incidents
    : incidents.filter(i => (i.priority || i.severity) === filterSeverity);

  return (
    <div className="p-6 md:p-8 bg-[#101214] min-h-screen text-slate-100 space-y-6 font-sans text-xs max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2b3036] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold text-white font-sans tracking-tight">
              Incidents
            </h1>
            {activeCount > 0 ? (
              <span className="text-xs font-bold px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full flex items-center gap-1.5 font-sans">
                <ShieldAlert size={14} /> {activeCount} Active Incident(s)
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5 font-sans">
                <CheckCircle2 size={14} /> {loading ? 'Loading incidents…' : error ? 'Status unavailable' : 'No active incidents'}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1 font-sans">
            Incident investigation, telemetry evidence, and risk assessment
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-[#181b1f] border border-[#2b3036] text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab 1: Active Operational Incidents */}
      {error && <div role="alert" className="text-rose-300">{error} <button onClick={loadData} className="underline">Retry</button></div>}
      {loading && <p>Loading incidents…</p>}
      {!loading && !error && (
        <div>
          {filteredIncidents.length > 0 ? (
            <div className="space-y-4">
              {filteredIncidents.map((item) => {
                const targetName = typeof item.device === 'string'
                  ? item.device
                  : (item.device?.name || item.device?.host || item.service || 'Target Host');
                const summaryText = typeof item.summary === 'string'
                  ? item.summary
                  : (item.error || 'Infrastructure Metric Degradation');
                const risk = item.priority || 'MEDIUM';

                return (
                  <div
                    key={item.id}
                    className="bg-[#181b1f] border border-[#2b3036] hover:border-teal-500/50 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-sm font-sans"
                  >
                    <div className="flex items-start gap-4">
                      <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border uppercase tracking-wider shrink-0 mt-0.5 ${
                        risk === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        risk === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {risk} RISK
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          🔴 {summaryText}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Target: <strong className="text-slate-200">{targetName}</strong> &bull; Status: <span className="text-teal-400 font-bold">{item.status || 'OPEN'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedIncident(item)}
                        className="bg-[#101214] hover:bg-[#2b3036] border border-[#2b3036] text-slate-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>Investigate</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 bg-[#181b1f] border border-dashed border-[#2b3036] rounded-xl flex flex-col items-center justify-center text-center space-y-3 font-sans">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">No incidents found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  No recorded incidents match the selected filter.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
