import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboard.service.js';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeviceTable() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await dashboardService.getDevicesStatus();
        setDevices(response.data);
      } catch (error) {
        console.error("Failed to fetch devices", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  if (loading) return <div className="mt-8 text-center text-gray-500">Loading device list...</div>;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Network Devices</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <th className="p-4 font-medium">Name / Host</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Latency</th>
              <th className="p-4 font-medium">Last Checked</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr
                key={device.id}
                onClick={() => navigate(`/devices/${device.id}`)}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Device Name and URL */}
                <td className="p-4">
                  <p className="font-medium text-gray-800">{device.name}</p>
                  <p className="text-xs text-gray-500">{device.host}</p>
                </td>

                {/* Color-Coded Status Badge */}
                <td className="p-4">
                  {device.status === 'UP' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 size={12} className="mr-1" /> UP
                    </span>
                  ) : device.status === 'DOWN' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle size={12} className="mr-1" /> DOWN
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <HelpCircle size={12} className="mr-1" /> UNKNOWN
                    </span>
                  )}
                </td>

                {/* Latency */}
                <td className="p-4 text-sm text-gray-600">
                  {device.latency ? `${device.latency} ms` : '-'}
                </td>

                {/* Timestamp */}
                <td className="p-4 text-sm text-gray-600">
                  {device.lastChecked ? new Date(device.lastChecked).toLocaleTimeString() : 'Never'}
                </td>

              </tr>
            ))}

            {/* Empty State */}
            {devices.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No devices found. Time to add some!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}