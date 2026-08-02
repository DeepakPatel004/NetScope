import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Server, Settings, Activity, Cpu, LogOut, Sparkles } from 'lucide-react';
import { authService } from '../../services/auth.service.js';

export default function Sidebar() {
  const navigate = useNavigate();
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Devices', path: '/devices', icon: Server },
    { name: 'AI Assistant', path: '/ai', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-900 text-slate-100 min-h-screen p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-3xl shadow-lg shadow-indigo-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">NetScope</h1>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mt-1">Developer Monitoring</p>
          </div>
        </div>


        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-md shadow-indigo-600/10 font-semibold border border-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 hover:border-slate-800 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    size={18}
                    className="text-slate-400 transition-colors duration-200 group-hover:text-slate-200"
                  />
                  <span className="text-sm font-medium tracking-wide text-slate-100">{item.name}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
            <Cpu size={16} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">API status</p>
            <p className="text-sm font-semibold text-white">Connected</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await authService.logout();
            navigate('/login');
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-slate-700 hover:text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
