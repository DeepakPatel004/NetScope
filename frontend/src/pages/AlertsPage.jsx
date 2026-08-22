import React from 'react';
import RecentAlertsTable from '../components/dashboard/RecentAlertsTable.jsx';
import { Bell } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="border-b border-[#1E293B] pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Bell size={24} className="text-indigo-400" />
          Alerts Log
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Historical alert notifications, triggers, and status state transitions across all monitored endpoints
        </p>
      </div>

      <RecentAlertsTable />
    </div>
  );
}
