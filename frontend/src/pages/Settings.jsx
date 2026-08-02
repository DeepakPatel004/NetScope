import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Lock, Mail, ShieldCheck, Key, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/auth.service.js';
import { useToast } from '../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Instant render from local session storage if available
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && (parsed.username || parsed.email)) {
              setProfile(parsed);
            }
          } catch (e) {}
        }

        const data = await authService.getProfile();
        if (data) {
          setProfile(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Failed to load user profile from API', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('Please enter your current and new password');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    toast.info('Logged out of account');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <span className="text-xs font-mono text-slate-500">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="rounded-[24px] border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs text-indigo-300 font-mono">
              <SettingsIcon size={14} /> Account Settings
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              User Profile & Security
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Manage your personal account details, credentials, and password security.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>

        {/* 1. Account Profile Details (Real Data) */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-3">
            <User size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Profile Details</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Full Name</span>
              <p className="text-sm font-bold text-white mt-1">{profile?.fullName || profile?.username || 'NetScope User'}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Username</span>
              <p className="text-sm font-mono font-bold text-indigo-300 mt-1">@{profile?.username || 'user'}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Email Address</span>
              <p className="text-sm font-mono font-bold text-slate-200 mt-1">{profile?.email || 'N/A'}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Role & Access</span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">{profile?.role || 'OPERATOR'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Change Password Form (Functional Backend API) */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-3 text-amber-400 border-b border-slate-800 pb-3">
            <Lock size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Update Security Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                placeholder="Enter current password..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-slate-100 outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password (min 6 chars)..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-slate-100 outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-slate-100 outline-none transition focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !passwordForm.oldPassword || !passwordForm.newPassword}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {passwordLoading ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
              <span>{passwordLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
