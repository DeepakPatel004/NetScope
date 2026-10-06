import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const SEVERITY_BADGES = {
  CRITICAL: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
  HIGH: 'bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30',
  MEDIUM: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  INFO: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
};

export default function RecentAlertsTable({ alerts = [], devices = [] }) {
  const navigate = useNavigate();

  // Generate real alerts list from devices with DOWN status or valid alerts
  const validAlerts = alerts.filter(a => a && (a.device || typeof a.service === 'string'));
  
  const realAlerts = devices.length === 0
    ? []
    : validAlerts.length > 0 
    ? validAlerts 
    : devices.filter(d => d && d.status === 'DOWN').map(d => ({
        id: `alert-down-${d.id}`,
        severity: 'CRITICAL',
        device: d.name || d.host,
        type: 'Availability',
        message: `Endpoint unreachable: ${d.host}`,
        time: d.lastChecked ? `${Math.round((Date.now() - new Date(d.lastChecked).getTime()) / 60000)}m ago` : 'Just now',
      }));

  return (
    <div className="bg-[#181b1f] border border-[#2b3036] rounded-xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          Recent Alerts & Security Events
          {realAlerts.length > 0 && (
            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
              {realAlerts.length} Active
            </span>
          )}
        </h3>
        <button
          onClick={() => navigate('/alerts')}
          className="text-xs font-semibold text-[#5eead4] hover:text-teal-300 transition cursor-pointer"
        >
          View all &rarr;
        </button>
      </div>

      {/* Table or Clean State */}
      {realAlerts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2b3036] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pr-4">Severity</th>
                <th className="pb-3 px-4">Device</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Message</th>
                <th className="pb-3 pl-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3036]/60 text-slate-300">
              {realAlerts.map((alert) => {
                const badgeStyle = SEVERITY_BADGES[alert.severity] || SEVERITY_BADGES.INFO;
                
                // Safely extract string values for device and message
                const deviceLabel = typeof alert.device === 'string' 
                  ? alert.device 
                  : (alert.device?.name || alert.device?.host || alert.service || 'Target Host');
                
                const messageLabel = typeof alert.message === 'string'
                  ? alert.message
                  : (alert.summary || alert.error || 'System metric alert');

                return (
                  <tr key={alert.id} className="hover:bg-[#101214]/50 transition duration-150">
                    <td className="py-3 pr-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                        {alert.severity || 'INFO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0 animate-pulse" />
                      <span>{deviceLabel}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-medium">{alert.type || 'Telemetry'}</td>
                    <td className="py-3 px-4 text-slate-300">{messageLabel}</td>
                    <td className="py-3 pl-4 text-right text-slate-400 whitespace-nowrap font-medium">{alert.time || 'Recent'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-[#2b3036] rounded-xl">
          <CheckCircle2 size={32} className="text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">No Active Alerts</h4>
          <p className="text-xs text-slate-500 max-w-sm font-normal">
            All configured monitoring targets are responding normally with zero active downtime alerts.
          </p>
        </div>
      )}
    </div>
  );
}
