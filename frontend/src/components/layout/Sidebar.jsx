import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  LayoutDashboard, 
  Server, 
  ShieldAlert, 
  Bot,
  Activity,
  Bell,
  FileText, 
  Terminal, 
  Settings, 
  Moon, 
  LogOut,
  ChevronLeft,
  Menu,
  BookOpen
} from 'lucide-react';
import { authService } from '../../services/auth.service.js';
import api from '../../services/api.js';

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [incidentCount, setIncidentCount] = useState(0);
  const [hasCritical, setHasCritical] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }

    const fetchIncidents = async () => {
      try {
        const response = await api.get('/ai/incidents');
        const list = response.data?.data || [];
        const openList = list.filter((i) => i.status !== 'RESOLVED');
        setIncidentCount(openList.length);
        setHasCritical(openList.some((i) => i.priority === 'CRITICAL' || i.severity === 'CRITICAL'));
      } catch (err) {
        // silent catch
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 20000);
    return () => clearInterval(interval);
  }, []);

  const primaryNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Devices', path: '/devices', icon: Server },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert, count: incidentCount, critical: hasCritical },
    { name: 'AI Assistant', path: '/ai', icon: Bot },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Logs', path: '/logs', icon: Terminal },
  ];

  const secondaryNavItems = [
    { name: 'Documentation', path: '/docs', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-[#0B0F19] border-r border-[#1E293B]/80 text-slate-300 min-h-screen flex flex-col justify-between transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-20 p-4' : 'w-64 p-5'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 px-1 font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#6366F1] text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <Zap size={20} className="fill-current" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                  NetScope
                </h1>
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  AI Observability & SRE
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition hidden md:block cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Primary Navigation Section */}
        <nav className="space-y-1 font-mono">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#1E293B]/50'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        size={16}
                        className={`transition-colors shrink-0 ${
                          isActive
                            ? 'text-white'
                            : item.critical && item.count > 0
                            ? 'text-rose-400 animate-pulse'
                            : 'text-slate-400 group-hover:text-indigo-400'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!collapsed && item.count !== undefined && item.count > 0 && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                        item.critical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse shadow-sm shadow-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-[#1E293B]" />

        {/* Secondary Navigation Section */}
        <nav className="space-y-1 font-mono">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#1E293B]/50'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      size={16}
                      className={`transition-colors shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Options */}
      <div className="space-y-3 pt-4 border-t border-[#1E293B]/60 font-mono">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-indigo-400" />
              <span className="font-semibold text-slate-300">Dark Mode</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Active</span>
          </div>
        )}

        <div className="flex items-center justify-between p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'N'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName || user?.username || 'SRE Operator'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Operator</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={async () => {
                await authService.logout();
                navigate('/login');
              }}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
