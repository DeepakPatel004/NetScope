import { Plus } from 'lucide-react';
import DeviceTable from '../components/DeviceTable.jsx';
import { Link } from 'react-router-dom';

export default function Devices() {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">All Devices</h1>
                <Link
                    to="/devices/new"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={20} />
                    Add New Device
                </Link>
            </div>

            <DeviceTable />
        </div>
    );
}