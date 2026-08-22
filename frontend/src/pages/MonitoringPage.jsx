import React from 'react';
import { Activity, Clock, Server, CheckCircle2 } from 'lucide-react';
import DeviceTable from '../components/DeviceTable.jsx';

export default function MonitoringPage() {
  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="border-b border-[#1E293B] pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Activity size={24} className="text-emerald-400" />
          Active Telemetry Monitors
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Automated HTTP, HTTPS, TCP, and ICMP ping check schedule powered by BullMQ workers
        </p>
      </div>

      <DeviceTable />
    </div>
  );
}
