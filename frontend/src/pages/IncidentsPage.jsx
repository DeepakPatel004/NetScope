import React, { useState, useEffect } from 'react';
import { ShieldAlert, Filter, CheckCircle2, ChevronRight, Activity, ThumbsUp, Info } from 'lucide-react';
import { aiInsightsService } from '../services/aiInsightsService.js';
import IncidentDetailsModal from '../components/incidents/IncidentDetailsModal.jsx';
import api from '../services/api.js';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeTab, setActiveTab] = useState('INCIDENTS'); // "INCIDENTS" or "ANOMALIES"
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incRes, anomRes] = await Promise.all([
        api.get('/ai/incidents').catch(() => ({ data: { data: [] } })),
        api.get('/ai/anomalies').catch(() => ({ data: { data: [] } })),
      ]);
      const incList = (incRes.data?.data || []).filter(i => i.device !== null);
      setIncidents(incList);
      setAnomalies(anomRes.data?.data || []);

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
      console.error('Failed to load incident engine data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIncidents = filterSeverity === 'ALL'
    ? incidents
    : incidents.filter(i => (i.priority || i.severity) === filterSeverity);

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6 font-mono text-xs max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
              INCIDENT & RISK MANAGEMENT ENGINE
            </h1>
            {filteredIncidents.length > 0 ? (
              <span className="text-xs font-bold px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full flex items-center gap-1.5 font-mono">
                <ShieldAlert size={14} /> {filteredIncidents.length} Active Incident(s)
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5 font-mono">
                <CheckCircle2 size={14} /> Systems Operational
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1 font-mono">
            AI Incident Investigation, Risk Assessment, and Human-Approved Recovery Governance
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-[#111827] border border-[#1E293B] text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#1E293B] pb-3">
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'INCIDENTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-[#111827] text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={14} />
          <span>Active Operational Incidents ({filteredIncidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ANOMALIES')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'ANOMALIES' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-[#111827] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={14} />
          <span>Telemetry Anomalies Logged ({anomalies.length})</span>
        </button>
      </div>

      {/* Tab 1: Active Operational Incidents */}
      {activeTab === 'INCIDENTS' && (
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
                const risk = item.riskLevel || item.priority || 'HIGH';
                const hasRecovery = item.recoveryActions && item.recoveryActions.length > 0;
                const recStatus = hasRecovery ? item.recoveryActions[0].status : 'RECOMMENDED';

                return (
                  <div
                    key={item.id}
                    className="bg-[#111827] border border-[#1E293B] hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-lg font-mono"
                  >
                    <div className="flex items-start gap-4">
                      <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border uppercase tracking-wider shrink-0 mt-0.5 ${
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
                          Target: <strong className="text-slate-200">{targetName}</strong> &bull; Status: <span className="text-indigo-400 font-bold">{item.status || 'OPEN'}</span> &bull; Agent: <span className="text-emerald-400">{item.device?.agentStatus || 'ONLINE'}</span>
                        </p>
                        {item.recoveryRecommendation && (
                          <div className="text-xs text-indigo-300 font-bold flex items-center gap-1.5 pt-1">
                            <span>💡 {item.recoveryRecommendation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedIncident(item)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                      >
                        <ThumbsUp size={14} />
                        <span>{recStatus === 'SUCCESS' ? '✓ Recovered' : 'Approve Recovery'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedIncident(item)}
                        className="bg-[#0B0F19] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
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
            <div className="py-16 bg-[#111827] border border-dashed border-[#1E293B] rounded-2xl flex flex-col items-center justify-center text-center space-y-3 font-mono">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">No Active Operational Incidents</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  All monitored customer infrastructure is operating within baseline parameters. Isolated metric anomalies are evaluated without creating alert noise.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Telemetry Anomalies Logged */}
      {activeTab === 'ANOMALIES' && (
        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <div className="py-12 bg-[#111827] border border-dashed border-[#1E293B] rounded-2xl text-center text-slate-400">
              No recent metric anomalies logged.
            </div>
          ) : (
            anomalies.map((anom) => (
              <div key={anom.id} className="p-4 bg-[#111827] border border-[#1E293B] rounded-xl flex items-center justify-between font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">📊 ANOMALY RECORDED</span>
                    <span className="text-slate-400 font-bold">{anom.device?.name || 'Resource'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      Score: {anom.anomalyScore.toFixed(2)} ({anom.severity})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{anom.detectionReason}</p>
                </div>

                <div className="text-[10px] text-slate-500 text-right">
                  Logged: {new Date(anom.timestamp).toLocaleTimeString()}
                  <span className="block text-emerald-400">No Alert Noise Sent</span>
                </div>
              </div>
            ))
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
