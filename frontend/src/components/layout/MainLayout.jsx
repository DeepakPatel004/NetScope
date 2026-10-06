import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Sidebar from './Sidebar.jsx';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-600">Loading page…</p>}><Outlet /></Suspense>
      </main>
    </div>
  );
}
