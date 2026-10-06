import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Key, Moon, Save } from 'lucide-react';
import api from '../services/api.js';
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
        setFullName(u.fullName || '');
        setEmail(u.email || '');
        setUsername(u.username || '');
      } catch (e) {}
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const response = await api.put('/auth/profile', { fullName, email, username });
      localStorage.setItem('user', JSON.stringify(response.data.data));
      toast.success('Profile saved.');
    } catch (error) { toast.error(error.response?.data?.message || 'Could not save your profile.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 md:p-10 bg-[#f8fafc] min-h-screen text-slate-900 space-y-10 max-w-[1500px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <SettingsIcon size={28} className="text-teal-700" />
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 font-sans tracking-tight">
              Account settings
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Update your workspace profile.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        
        {/* 1. OPERATOR PROFILE */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 uppercase font-sans tracking-wider flex items-center gap-2">
            <User size={18} className="text-teal-700" /> OPERATOR PROFILE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
            <div className="space-y-2">
              <label className="text-slate-600 font-bold uppercase text-[11px] block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-slate-900 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-teal-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-600 font-bold uppercase text-[11px] block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-slate-900 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-teal-500 font-sans"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-slate-600 font-bold uppercase text-[11px] block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-slate-900 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-teal-500 font-sans"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm  font-sans"
          >
            <Save size={16} />
            <span>{loading ? 'Saving Profile...' : 'Save Workspace Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
