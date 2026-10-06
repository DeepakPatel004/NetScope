import { useState } from 'react';
import { RefreshCw, Plus, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationDrawer from './NotificationDrawer.jsx';

export default function Header({ onRefresh, loading, refreshInterval, setRefreshInterval, lastUpdated }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-[#2b3036]">
      <NotificationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div><p className="text-xs text-slate-500 mb-2">Workspace / Overview</p><h1 className="text-2xl font-semibold tracking-tight text-white">Infrastructure overview</h1><p className="text-sm text-slate-400 mt-2">{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Availability, performance, and incidents in one place.'}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button aria-label="Open notifications" onClick={() => setIsDrawerOpen(true)} className="p-2.5 rounded-lg border border-[#2b3036] text-slate-400 hover:text-white"><Bell size={16} /></button>
        <button aria-label="Refresh dashboard" onClick={onRefresh} disabled={loading} className="p-2.5 rounded-lg border border-[#2b3036] text-slate-400 hover:text-white disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        <select aria-label="Dashboard refresh interval" value={refreshInterval} onChange={event => setRefreshInterval(Number(event.target.value))} className="text-xs rounded-lg border border-[#2b3036] bg-[#181b1f] px-2 py-2.5 text-slate-300">
          <option value={0}>Manual refresh</option><option value={30}>Every 30 seconds</option><option value={60}>Every minute</option><option value={300}>Every 5 minutes</option>
        </select>
        <Link to="/devices/new" className="flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium px-3 py-2"><Plus size={16} />Add device</Link>
      </div>
    </header>
  );
}
