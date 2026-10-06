import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Server, ShieldAlert, Bot, Bell, FileText, Terminal, Settings, LogOut, PanelLeftClose, PanelLeftOpen, BookOpen, Radio } from 'lucide-react';
import { authService } from '../../services/auth.service.js';

const groups = [
  { label: 'Workspace', items: [
    ['Overview', '/dashboard', LayoutDashboard],
    ['Monitors', '/devices', Server],
    ['Probes Fleet', '/probes', Radio],
    ['Incidents', '/incidents', ShieldAlert],
    ['Logs', '/logs', Terminal],
  ] },
  { label: 'Tools', items: [
    ['Reports', '/reports', FileText],
    ['Notifications', '/alerts', Bell],
  ] },
  { label: 'Manage', items: [['Settings', '/settings', Settings], ['Documentation', '/docs', BookOpen]] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  return (
    <aside className={`sticky top-0 h-screen shrink-0 border-r border-[#2b3036] bg-[#151719] flex flex-col ${collapsed ? 'w-16' : 'w-16 md:w-56'}`}>
      <NavLink to="/dashboard" aria-label="NetScope overview" className="flex items-center gap-3 h-20 px-5 border-b border-[#2b3036]">
        <Activity size={23} className="shrink-0 text-teal-400" />
        {!collapsed && <span className="hidden md:block text-lg font-semibold tracking-tight text-white">NetScope</span>}
      </NavLink>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 md:px-3 py-5 space-y-6">
        {groups.map(group => <div key={group.label}>
          {!collapsed && <p className="hidden md:block px-3 mb-2 text-[11px] font-medium text-slate-500">{group.label}</p>}
          <div className="space-y-1">{group.items.map(([label, path, Icon]) => (
            <NavLink key={path} to={path} title={label} aria-label={label} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-white/7 text-white' : 'text-slate-400 hover:bg-white/4 hover:text-slate-100'}`}>
              <Icon size={17} className="shrink-0" />{!collapsed && <span className="hidden md:block">{label}</span>}
            </NavLink>
          ))}</div>
        </div>)}
      </nav>
      <div className="border-t border-[#2b3036] p-3 space-y-3">
        <button onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} className="hidden md:flex items-center gap-3 p-2 text-slate-500 hover:text-white text-xs w-full">
          {collapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} />Collapse sidebar</>}
        </button>
        <div className="flex items-center justify-between gap-2 px-1">
          {!collapsed && <div className="hidden md:block min-w-0"><p className="text-xs text-slate-200 truncate">{user?.fullName || user?.username || 'Your workspace'}</p><p className="text-[11px] text-slate-500 mt-1">Infrastructure monitoring</p></div>}
          <button title="Sign out" aria-label="Sign out" onClick={async () => { await authService.logout(); navigate('/login'); }} className="p-2 text-slate-500 hover:text-rose-300"><LogOut size={17} /></button>
        </div>
      </div>
    </aside>
  );
}
