import React, { useEffect, useState, useCallback } from 'react';
import Header from '../components/layout/Header.jsx';
import KPICards from '../components/dashboard/KPICards.jsx';
import LatencyOverviewChart from '../components/dashboard/LatencyOverviewChart.jsx';
import DeviceStatusDonut from '../components/dashboard/DeviceStatusDonut.jsx';
import ActiveIncidentsPanel from '../components/dashboard/ActiveIncidentsPanel.jsx';
import AIInsightCard from '../components/dashboard/AIInsightCard.jsx';
import SupportingMetrics from '../components/dashboard/SupportingMetrics.jsx';
import RecentAlertsTable from '../components/dashboard/RecentAlertsTable.jsx';
import UptimeHistoryChart from '../components/dashboard/UptimeHistoryChart.jsx';
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

  // Compute real donut breakdown from real devices
  const healthyCount = devices.filter(d => d.status === 'UP').length;
  const warningCount = devices.filter(d => d.status === 'WARNING').length;
  const criticalCount = devices.filter(d => d.status === 'DOWN').length;
  const unknownCount = devices.filter(d => !d.status || d.status === 'UNKNOWN').length;
  const totalCount = devices.length;

  const realStatusData = totalCount > 0 ? [
    { name: 'Healthy', value: healthyCount, pct: `${Math.round((healthyCount / totalCount) * 100)}%` },
    { name: 'Warning', value: warningCount, pct: `${Math.round((warningCount / totalCount) * 100)}%` },
    { name: 'Critical', value: criticalCount, pct: `${Math.round((criticalCount / totalCount) * 100)}%` },
    { name: 'Unknown', value: unknownCount, pct: `${Math.round((unknownCount / totalCount) * 100)}%` },
  ] : null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 space-y-6">
      {/* 1. Dashboard Top Header & Control Bar */}
      <Header
        onRefresh={handleManualRefresh}
        loading={loading}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
      />

      {/* 2. 5 KPI Metrics Cards Row */}
      <KPICards metrics={summary} devices={devices} />

      {/* 3. Main Row 1: Latency Overview Chart & Right Panels (Device Status + Active Incidents) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latency Overview Chart (Left 7 Cols) */}
        <div className="lg:col-span-7">
          <LatencyOverviewChart devices={devices} />
        </div>

        {/* Right Stacked Column (Right 5 Cols): Device Status Donut + Active Incidents */}
        <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <DeviceStatusDonut statusData={realStatusData} totalCount={totalCount} />
          <ActiveIncidentsPanel
            incidents={incidents}
            devices={devices}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        </div>
      </div>

      {/* 4. Supporting Metric Cards Row (Response Time, Monitored Endpoints, SSL Audits, Uptime Rate) */}
      <SupportingMetrics metrics={summary} devices={devices} />

      {/* 5. Main Row 2: Recent Alerts Table + AI Insights Beta Card + Uptime History Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Alerts Table (Left 7 Cols) */}
        <div className="lg:col-span-7">
          <RecentAlertsTable alerts={incidents} devices={devices} />
        </div>

        {/* Right Column: AI Insights Beta Panel + Uptime History Bar Chart */}
        <div className="lg:col-span-5 flex flex-col gap-6">
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

          <UptimeHistoryChart />
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