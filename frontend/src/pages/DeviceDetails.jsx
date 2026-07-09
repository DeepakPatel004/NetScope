import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard.service.js';
import { ArrowLeft, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DeviceDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      
      
      try {
        const response = await dashboardService.getDeviceDetails(id);
        // Reverse the timeline so the chart reads left-to-right (oldest to newest)
        const chartData = [...response.data.timeline].reverse().map(log => ({
          time: new Date(log.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency: log.latency || 0,
          status: log.status
        }));
        
        setData({ ...response.data, chartData });
      } catch (error) {
        console.error("Failed to fetch device details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Device not found.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/devices" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{data.deviceInfo.name}</h1>
          <p className="text-gray-500">{data.deviceInfo.host}</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Uptime</p>
            <p className="text-2xl font-bold">{data.analytics.uptimePercentage}%</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Latency</p>
            <p className="text-2xl font-bold">{data.analytics.averageLatency} ms</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Seen</p>
            <p className="text-lg font-bold">
              {data.analytics.lastSeen ? new Date(data.analytics.lastSeen).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Latency Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Latency History</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}