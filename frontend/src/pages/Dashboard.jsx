import { useEffect, useState, useCallback, useRef } from 'react';
import Header from '../components/layout/Header.jsx';
import KPICards from '../components/dashboard/KPICards.jsx';
import ResourceHealthTable from '../components/dashboard/ResourceHealthTable.jsx';
import LatencyOverviewChart from '../components/dashboard/LatencyOverviewChart.jsx';
import ActiveIncidentsPanel from '../components/dashboard/ActiveIncidentsPanel.jsx';
import IncidentDetailsModal from '../components/incidents/IncidentDetailsModal.jsx';
import { dashboardService } from '../services/dashboard.service.js';
import api from '../services/api.js';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const inFlight = useRef(false);
  const fetchData = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const [devicesRes, incidentsRes] = await Promise.all([dashboardService.getDevicesStatus(), api.get('/incidents')]);
      setDevices(devicesRes.data || []);
      setIncidents(incidentsRes.data?.data || []);
      setLastUpdated(Date.now());
      setError('');
    } catch { setError('Could not refresh the dashboard. Previously loaded data may be out of date.'); }
    finally { inFlight.current = false; setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!refreshInterval) return;
    const timer = setInterval(() => { if (!document.hidden) fetchData(); }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [fetchData, refreshInterval]);

  return <div className="max-w-[1440px] mx-auto p-5 sm:p-8 space-y-7 text-slate-900">
    <Header onRefresh={fetchData} loading={loading} refreshInterval={refreshInterval} setRefreshInterval={setRefreshInterval} lastUpdated={lastUpdated} />
    {error && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">{error}</p>}
    <KPICards devices={devices} incidents={incidents} loading={!lastUpdated} />
    <section><h2 className="text-base font-semibold mb-4">Devices</h2>{loading && !lastUpdated ? <p className="text-sm text-slate-500">Loading devices…</p> : <ResourceHealthTable devices={devices} incidents={incidents} />}</section>
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5"><div className="xl:col-span-3"><LatencyOverviewChart devices={devices} refreshKey={lastUpdated} /></div><section className="xl:col-span-2"><ActiveIncidentsPanel incidents={incidents} devices={devices} onSelectIncident={setSelectedIncident} /></section></div>
    {selectedIncident && <IncidentDetailsModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}
  </div>;
}
