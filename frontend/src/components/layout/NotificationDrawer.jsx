import React, { useEffect, useState } from 'react';
import { Bell, X, Check, ShieldAlert, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

export default function NotificationDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert size={16} className="text-red-400" />;
      case 'HIGH':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'MEDIUM':
        return <Info size={16} className="text-teal-400" />;
      default:
        return <CheckCircle size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#181b1f] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-teal-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">Observability Alerts</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-sans">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-slate-400 hover:text-teal-400 transition flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <Check size={14} />
                  <span>Read all</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-400">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 space-y-2">
                <CheckCircle size={32} className="mx-auto text-slate-700" />
                <p>No notifications recorded.</p>
              </div>
            ) : (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all relative group ${
                    noti.isRead
                      ? 'bg-slate-900/60 border-slate-800/60 opacity-75'
                      : 'bg-slate-900 border-teal-500/30 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(noti.severity)}
                      <span className="font-bold text-slate-100">{noti.title}</span>
                    </div>
                    <span className="text-[10px] font-sans text-slate-400 shrink-0">
                      {new Date(noti.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed mb-2.5">{noti.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-[9px] font-sans font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                      {noti.type}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {noti.incidentId && (
                        <button
                          onClick={() => {
                            onClose();
                            navigate('/incidents');
                          }}
                          className="text-teal-400 hover:text-teal-300 transition flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <span>View Incident</span>
                          <ExternalLink size={12} />
                        </button>
                      )}

                      {!noti.isRead && (
                        <button
                          onClick={() => handleMarkRead(noti.id)}
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                          title="Mark read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
            <button
              onClick={() => {
                onClose();
                navigate('/alerts');
              }}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition cursor-pointer"
            >
              Configure Notification Preferences &rarr;
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
