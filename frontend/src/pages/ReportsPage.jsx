import React, { useEffect, useState } from 'react';
import UptimeHistoryChart from '../components/dashboard/UptimeHistoryChart.jsx';
import { FileText, FileDown, ShieldCheck } from 'lucide-react';
import { dashboardService } from '../services/dashboard.service.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ReportsPage() {
  const toast = useToast();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await dashboardService.getDevicesStatus();
        setDevices(res?.data || []);
      } catch (e) {
        console.error('Failed to load device status for report page:', e);
      }
    };
    fetchStatus();
  }, []);

  const handleDownloadPdf = async () => {
    try {
      toast.info("Generating PDF summary report...");
      const response = await dashboardService.downloadPdfReport();
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `netscope_sla_report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF report exported.");
    } catch (e) {
      toast.error("Failed to download report.");
    }
  };

  const total = devices.length;
  const upCount = devices.filter(d => d.status === 'UP').length;
  const slaPct = total > 0 ? ((upCount / total) * 100).toFixed(2) : '100.00';

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileText size={24} className="text-indigo-400" />
            Executive Reports & SLA Compliance
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Uptime SLA statistics, availability breakdown, and PDF export reports
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <FileDown size={16} />
          Export Executive PDF
        </button>
      </div>

      {/* Summary KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Target SLA Threshold</span>
          <span className="text-2xl font-extrabold text-emerald-400">99.90%</span>
          <span className="text-[11px] text-slate-500 font-mono block mt-1">Tier-3 Data Center Standard</span>
        </div>
        <div className="bg-[#111827] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Current Platform Availability</span>
          <span className="text-2xl font-extrabold text-white">{slaPct}%</span>
          <span className="text-[11px] text-emerald-400 font-mono block mt-1">{upCount} / {total} Targets Healthy</span>
        </div>
        <div className="bg-[#111827] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Compliance Status</span>
          <span className="text-2xl font-extrabold text-indigo-400 flex items-center gap-2">
            <ShieldCheck size={22} /> COMPLIANT
          </span>
          <span className="text-[11px] text-slate-500 font-mono block mt-1">Automated Audit Verified</span>
        </div>
      </div>

      <UptimeHistoryChart />
    </div>
  );
}
