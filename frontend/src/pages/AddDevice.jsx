import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceService } from '../services/device.service.js';
import { Save, ArrowLeft, Globe, Shield, Terminal, Settings, Info, Loader2 } from 'lucide-react';

export default function AddDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    type: 'WEBSITE',
    interval: 60,
    enabled: true,
  });

  // Fetch current configuration if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchDevice = async () => {
      try {
        setFetching(true);
        setError(null);
        const response = await deviceService.getDeviceById(id);
        const device = response.data;
        if (device) {
          setFormData({
            name: device.name,
            host: device.host,
            type: device.type,
            interval: device.interval,
            enabled: device.enabled ?? true,
          });
        } else {
          setError("Device configuration not found.");
        }
      } catch (err) {
        console.error("Failed to load device details", err);
        setError("Error loading device details.");
      } finally {
        setFetching(false);
      }
    };

    fetchDevice();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : (name === 'interval' ? Number(value) : value)
    }));
  };

  const handleTypeSelect = (selectedType) => {
    setFormData((prev) => ({
      ...prev,
      type: selectedType
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Minor client-side format cleaning
    let cleanHost = formData.host.trim();
    if (formData.type !== 'IP' && !cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
      // Default to HTTPS if missing schema
      cleanHost = 'https://' + cleanHost;
    }

    const payload = {
      ...formData,
      host: cleanHost,
    };

    try {
      if (isEditMode) {
        await deviceService.updateDevice(id, payload);
      } else {
        await deviceService.createDevice(payload);
      }
      navigate('/devices'); // Return to Catalog
    } catch (err) {
      console.error("Submission failed", err);
      setError(err.response?.data?.message || 'Failed to save device configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="text-sm font-semibold text-slate-500">Syncing config data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/devices')}
            className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {isEditMode ? 'Edit Configuration' : 'Add New Device'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isEditMode ? 'Modify host credentials and monitoring intervals' : 'Set up background checks on an endpoint'}
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-8 backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Device Display Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Portfolio Website, Payment Gateway"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Type selector (Premium Tabs) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Endpoint Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeSelect('WEBSITE')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-bold transition-all ${
                    formData.type === 'WEBSITE'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-800'
                  }`}
                >
                  <Globe size={18} />
                  <span>Website</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect('API')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-bold transition-all ${
                    formData.type === 'API'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-800'
                  }`}
                >
                  <Shield size={18} />
                  <span>API Endpoint</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect('IP')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-bold transition-all ${
                    formData.type === 'IP'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-800'
                  }`}
                >
                  <Terminal size={18} />
                  <span>IP / Hostname</span>
                </button>
              </div>
            </div>

            {/* Target Host Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Target Connection Host
              </label>
              <input
                type="text"
                name="host"
                required
                placeholder={formData.type === 'IP' ? 'e.g. 192.168.1.1 or database.internal' : 'e.g. myapi.com/v1/health'}
                value={formData.host}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                <Info size={12} className="text-slate-400 shrink-0" />
                {formData.type === 'IP' 
                  ? 'Will send ICMP echo requests (pings) directly to check host latency.' 
                  : 'Will perform standard HTTP GET request checks. If protocol is missing, https:// is prepended.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Interval Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Scan Frequency
                </label>
                <div className="relative">
                  <select
                    name="interval"
                    value={formData.interval}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm outline-none transition-all appearance-none cursor-pointer font-semibold"
                  >
                    <option value={30}>Every 30 Seconds</option>
                    <option value={60}>Every 1 Minute</option>
                    <option value={300}>Every 5 Minutes</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Settings size={14} />
                  </div>
                </div>
              </div>

              {/* Active Monitoring Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Monitoring State
                </label>
                <label className="flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-xl p-3 cursor-pointer hover:bg-slate-950/70 hover:border-slate-800 transition-all select-none">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-850 rounded focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">Enabled</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Toggle daemon monitoring background checks</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-6 border-t border-slate-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/devices')}
                className="px-5 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{isEditMode ? 'Update Device' : 'Save Device'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}