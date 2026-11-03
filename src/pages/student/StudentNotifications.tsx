import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const StudentNotifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time alerts regarding your reported campus problems</p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No notifications recorded yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.notificationId}
              onClick={() => {
                markAsRead(notif.notificationId);
                if (notif.complaintId) {
                  navigate(`/student/complaints/${notif.complaintId}`);
                }
              }}
              className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                !notif.read ? 'bg-indigo-50/40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    notif.type === 'escalation'
                      ? 'bg-rose-100 text-rose-600'
                      : notif.type === 'assignment'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {notif.type === 'escalation' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(notif.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {notif.complaintId && (
                <span className="text-xs font-bold text-indigo-600 shrink-0 flex items-center gap-1 hover:translate-x-0.5 transition-transform">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
