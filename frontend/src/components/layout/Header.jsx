import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Plus, Clock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [countdown, setCountdown] = useState(42);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onRefresh) onRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, onRefresh]);

  const formattedCountdown = `00:${countdown < 10 ? '0' : ''}${countdown}`;

  return (
    <div className="space-y-4 mb-6">
      {/* Title & Top Right Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Overview
            </h1>
            <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Global Platform View
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1 font-normal">
            Platform-wide telemetry aggregate across all monitored endpoints
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange && setTimeRange(e.target.value)}
              className="appearance-none bg-[#111827] border border-[#1E293B] text-slate-300 px-3.5 py-2 pr-8 rounded-xl text-xs font-medium cursor-pointer hover:border-slate-700 focus:outline-none"
            >
              <option value="15m">Last 15 mins</option>
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
            <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Interval Selector */}
          <div className="flex items-center bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-slate-300 px-3 py-2 gap-2">
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-white transition cursor-pointer"
              title="Manual Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
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

          {/* Add Device Button */}
          <button
            onClick={() => navigate('/devices/new')}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Plus size={15} />
            Add Endpoint
          </button>
        </div>
      </div>

      {/* Monitoring Control Bar */}
      <div className="bg-[#111827]/90 border border-[#1E293B] rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Global Telemetry Engine</span>
            <button
              onClick={() => setMonitorsActive(!monitorsActive)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                monitorsActive ? 'bg-[#10B981] justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#1E293B] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Check Interval:</span>
            <span className="font-medium text-slate-200">1 minute</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-400">Next Automatic Sweep:</span>
          <span className="font-mono font-bold text-[#10B981]">{formattedCountdown}</span>
        </div>
      </div>
    </div>
  );
}
