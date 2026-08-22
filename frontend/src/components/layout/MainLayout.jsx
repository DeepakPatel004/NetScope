import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#0B0F19]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
}
