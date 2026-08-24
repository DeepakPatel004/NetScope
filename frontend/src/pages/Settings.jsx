import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Key, Moon, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function Settings() {
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setFullName(u.fullName || 'SRE Operator');
        setEmail(u.email || 'operator@company.com');
        setUsername(u.username || 'operator');
      } catch (e) {}
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Workspace profile updated successfully');
    }, 800);
  };

  return (
    <div className="p-8 md:p-10 bg-[#0B0F19] min-h-screen text-slate-100 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <SettingsIcon size={28} className="text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
              WORKSPACE & ACCOUNT SETTINGS
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage your SRE operator profile, workspace authentication, and display preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        
        {/* 1. OPERATOR PROFILE */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <User size={18} className="text-indigo-400" /> OPERATOR PROFILE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-2">
              <label className="text-slate-400 font-bold uppercase text-[11px] block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 font-bold uppercase text-[11px] block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-slate-400 font-bold uppercase text-[11px] block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* 2. THEME & DISPLAY PREFERENCES */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Moon size={18} className="text-indigo-400" /> DISPLAY PREFERENCES
          </h2>

          <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-xl flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-white font-bold text-sm block">Dark Theme Mode</span>
              <span className="text-slate-400 text-xs">Spacious dark slate observability theme</span>
            </div>
            <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg">
              ● ACTIVE
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 font-mono"
          >
            <Save size={16} />
            <span>{loading ? 'Saving Profile...' : 'Save Workspace Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
