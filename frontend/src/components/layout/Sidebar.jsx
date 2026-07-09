import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Settings, Activity, Cpu } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Devices', path: '/devices', icon: Server },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 text-slate-100 min-h-screen p-6 flex flex-col justify-between">
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10 px-2 mt-2">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity className="text-white animate-pulse" size={22} />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
              NETSCOPE
            </span>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-0.5">
              Network Daemon
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-md shadow-indigo-600/10 font-semibold border border-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 hover:border-slate-800 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      size={18} 
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
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

      {/* Footer Details */}
      <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-center gap-3">
        <div className="p-2 bg-slate-800/80 rounded-lg text-slate-400">
          <Cpu size={16} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-350 leading-none">System Engine</div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Node Connected
          </div>
        </div>
      </div>
    </div>
  );
}