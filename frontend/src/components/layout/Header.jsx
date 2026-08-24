import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Plus, Clock, Bell, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationDrawer from './NotificationDrawer.jsx';
import api from '../../services/api.js';

export default function Header({ 
  onRefresh, 
  loading, 
  timeRange = '1h', 
  setTimeRange, 
  refreshInterval = 60, 
  setRefreshInterval 
}) {
  const navigate = useNavigate();
  const [monitorsActive, setMonitorsActive] = useState(true);
  const [countdown, setCountdown] = useState(refreshInterval);
  const [lastSweepSec, setLastSweepSec] = useState(8);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState({
    type: 'OPERATIONAL', // 'OPERATIONAL', 'DEGRADED', 'CRITICAL'
    message: 'All Systems Operational',
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [notiRes, summaryRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/dashboard/summary'),
        ]);

        const notis = notiRes.data?.data || [];
        setUnreadCount(notis.filter((n) => !n.isRead).length);

        const summary = summaryRes.data?.data || {};
        const total = summary.totalDevices || 0;
        const down = summary.downDevices || 0;
        const incidents = summary.activeIncidents || 0;

        if (incidents > 0 || down > 0) {
          if (down > 0 || incidents > 2) {
            setSystemStatus({
              type: 'CRITICAL',
              message: `${incidents || down} Critical Incident${incidents > 1 ? 's' : ''}`,
            });
          } else {
            setSystemStatus({
              type: 'DEGRADED',
              message: `${incidents} Resource${incidents > 1 ? 's' : ''} Degraded`,
            });
          }
        } else {
          setSystemStatus({
            type: 'OPERATIONAL',
            message: 'All Systems Operational',
          });
        }
      } catch (err) {
        // silent catch
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastSweepSec((prev) => prev + 1);
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onRefresh) onRefresh();
          setLastSweepSec(0);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, onRefresh]);

  const formattedCountdown = `${countdown}s`;

  return (
    <div className="space-y-4 mb-6">
      <NotificationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono">
              NetScope
            </h1>

            {/* Global System Status Indicator */}
            {systemStatus.type === 'OPERATIONAL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono">
                <ShieldCheck size={14} />
                <span>● {systemStatus.message}</span>
              </span>
            )}
            {systemStatus.type === 'DEGRADED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono">
                <AlertTriangle size={14} />
                <span>⚠ {systemStatus.message}</span>
              </span>
            )}
            {systemStatus.type === 'CRITICAL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono animate-pulse">
                <ShieldAlert size={14} />
                <span>🔴 {systemStatus.message}</span>
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real-time infrastructure observability & automated AI incident investigation engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Notification Bell Icon */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2.5 bg-[#111827] border border-[#1E293B] hover:border-indigo-500/50 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Observability Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-indigo-500 text-white font-bold text-[9px] flex items-center justify-center rounded-full border border-[#0F172A] animate-pulse font-mono">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange && setTimeRange(e.target.value)}
              className="appearance-none bg-[#111827] border border-[#1E293B] text-slate-300 px-3.5 py-2 pr-8 rounded-xl text-xs font-medium cursor-pointer hover:border-slate-700 focus:outline-none font-mono"
            >
              <option value="15m">Last 15 mins</option>
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
            <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Interval Selector */}
          <div className="flex items-center bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-slate-300 px-3 py-2 gap-2 font-mono">
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-white transition cursor-pointer"
              title="Manual Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval && setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-300 text-xs font-medium cursor-pointer focus:outline-none"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={300}>5m</option>
            </select>
          </div>

          {/* Add Resource Button */}
          <button
            onClick={() => navigate('/devices/new')}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Plus size={15} />
            + Add Resource
          </button>
        </div>
      </div>

      {/* Monitoring Control Bar */}
      <div className="bg-[#111827]/90 border border-[#1E293B] rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Telemetry:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="h-4 w-px bg-[#1E293B] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Last Sweep:</span>
            <span className="text-slate-200">{lastSweepSec} seconds ago</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-400">Next Check:</span>
          <span className="font-bold text-[#10B981]">{formattedCountdown}</span>
        </div>
      </div>
    </div>
  );
}
