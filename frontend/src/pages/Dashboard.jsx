import React, { useEffect, useState, useCallback } from 'react';
import Header from '../components/layout/Header.jsx';
import KPICards from '../components/dashboard/KPICards.jsx';
import ResourceHealthTable from '../components/dashboard/ResourceHealthTable.jsx';
import LatencyOverviewChart from '../components/dashboard/LatencyOverviewChart.jsx';
import ActiveIncidentsPanel from '../components/dashboard/ActiveIncidentsPanel.jsx';
import AIInsightCard from '../components/dashboard/AIInsightCard.jsx';
import IncidentDetailsModal from '../components/incidents/IncidentDetailsModal.jsx';

import { dashboardService } from '../services/dashboard.service.js';
import { aiInsightsService } from '../services/aiInsightsService.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Dashboard() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [anomaly, setAnomaly] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState(60);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, devicesRes, anomalyRes, incidentRes] = await Promise.all([
        dashboardService.getSummary().catch(() => ({ data: null })),
        dashboardService.getDevicesStatus().catch(() => ({ data: [] })),
        aiInsightsService.getLatestAnomaly(),
        aiInsightsService.getActiveIncidents()
      ]);

      if (dashRes?.data) setSummary(dashRes.data);
      if (devicesRes?.data) setDevices(devicesRes.data);
      if (anomalyRes) setAnomaly(anomalyRes);
      if (incidentRes) setIncidents(incidentRes);
    } catch (err) {
      console.error('Failed to sync dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard metrics synced.');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-8 md:p-10 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* SECTION 1: Page Header */}
      <Header
        onRefresh={handleManualRefresh}
        loading={loading}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
      />

      {/* SECTION 2: Key Platform Status */}
      <section className="space-y-4">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
          01 / Key Platform Status
        </h2>
        <KPICards metrics={summary} devices={devices} />
      </section>

      {/* SECTION 3: Resource Health Matrix */}
      <section className="space-y-4">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
          02 / Resource Health Matrix
        </h2>
        <ResourceHealthTable devices={devices} incidents={incidents} />
      </section>

      {/* SECTION 4: Service Performance Trends */}
      <section className="space-y-4">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
          03 / Performance Trends
        </h2>
        <LatencyOverviewChart devices={devices} />
      </section>

      {/* SECTION 5 & 6: Active Incidents & AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
            04 / Active Operational Incidents
          </h2>
          <ActiveIncidentsPanel
            incidents={incidents}
            devices={devices}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
            05 / AI Telemetry Intelligence
          </h2>
          <AIInsightCard
            anomaly={anomaly}
            devices={devices}
            onOpenModal={(anom) => {
              const matched = incidents[0] || {
                id: 'inc-ai-1',
                priority: anom?.severity || 'HIGH',
                priorityScore: (anom?.anomalyScore || 0.73) * 10,
                summary: anom?.detectionReason || 'System health baseline check.',
                possibleCauses: anom?.possibleCauses || ['Latency variation evaluated'],
                recommendedActions: anom?.recommendedActions || ['Monitor endpoint trend'],
                confidence: 0.92,
                device: anom?.device || devices[0] || { name: 'Target Host', host: 'localhost' }
              };
              setSelectedIncident(matched);
            }}
          />
        </div>
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}