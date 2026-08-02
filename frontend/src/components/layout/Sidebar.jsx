import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Server, Settings, Activity, Cpu, LogOut, Sparkles, BookOpen, User } from 'lucide-react';
import { authService } from '../../services/auth.service.js';

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Devices', path: '/devices', icon: Server },
    { name: 'AI Assistant', path: '/ai', icon: Sparkles },
    { name: 'Documentation', path: '/docs', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-900 text-slate-100 min-h-screen p-6 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              NetScope
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-slate-400">Developer Monitoring</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-semibold border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                    />
                    <span className="text-sm font-medium tracking-wide">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || <User size={14} />}
            </div>
            <div className="truncate max-w-[130px]">
              <p className="text-xs font-bold text-white truncate">{user?.fullName || user?.username || 'Operator'}</p>
              <p className="text-[10px] font-mono text-slate-400 truncate">{user?.email || 'Connected'}</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await authService.logout();
              navigate('/login');
            }}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
