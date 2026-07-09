import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboard.service.js';
import { Activity, Server, CheckCircle, XCircle } from 'lucide-react';
import DeviceTable from '../components/DeviceTable.jsx';
export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getSummary();
        setSummary(data.data); 
      } catch (error) {
        console.error("Failed to fetch dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading network data...</div>;
  if (!summary) return <div className="p-8 text-center text-red-500">Failed to load dashboard.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Network Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Devices */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Server size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Devices</p>
            <p className="text-2xl font-bold text-gray-800">{summary.totalDevices}</p>
          </div>
        </div>

        {/* Online */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Online</p>
            <p className="text-2xl font-bold text-gray-800">{summary.online}</p>
          </div>
        </div>

        {/* Offline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Offline</p>
            <p className="text-2xl font-bold text-gray-800">{summary.offline}</p>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Latency</p>
            <p className="text-2xl font-bold text-gray-800">{summary.averageLatency} ms</p>
          </div>
        </div>
      </div>
      <DeviceTable />
    </div>
  );
}