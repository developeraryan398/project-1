import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Database,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
  Users,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { isFirebaseConfigured } from '../../services/firebase';
import { FirebaseConfigModal } from '../common/FirebaseConfigModal';
import { QrCodeModal } from '../common/QrCodeModal';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { currentUser, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const isCloudDb = isFirebaseConfigured();

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Mobile hamburger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg tracking-tight text-slate-900 font-sans">
                      Campus<span className="text-indigo-600">Fix</span>
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase tracking-wider border border-indigo-100">
                      Smart Campus
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 hidden sm:block tracking-wide font-medium">
                    Report It. Track It. Fix It.
                  </p>
                </div>
              </Link>
            </div>

            {/* Middle: Authenticated User Status Pill (Read-Only) */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2.5 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/90 text-xs shadow-2xs">
                <span className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-purple-600' : role === 'staff' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
                <span className="font-bold text-slate-800">{currentUser.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${getRoleBadge()}`}>
                  {role}
                </span>
                {currentUser.departmentName && (
                  <span className="text-[11px] text-slate-500 hidden lg:inline border-l border-slate-200 pl-2">
                    {currentUser.departmentName}
                  </span>
                )}
              </div>
            )}

            {/* Right: Actions, Notifications, QR, DB Status, User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* QR Location button */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Campus Location QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>

              {/* Database Status Button */}
              <button
                type="button"
                onClick={() => setShowFirebaseModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                title="Database & Sync Status"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">
                  {isCloudDb ? 'Firestore Cloud' : 'Real-Time Sync'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.notificationId}
                            onClick={() => {
                              markAsRead(notif.notificationId);
                              if (notif.complaintId) {
                                if (role === 'student') navigate(`/student/complaints/${notif.complaintId}`);
                                else if (role === 'staff') navigate(`/staff/complaints/${notif.complaintId}`);
                                else navigate(`/admin/complaints`);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              !notif.read ? 'bg-indigo-50/40 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-900 text-xs">{notif.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <Link
                    to={role === 'student' ? '/student/profile' : role === 'staff' ? '/staff/profile' : '/admin'}
                    className="flex items-center gap-2 group"
                  >
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login?portal=admin"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Admin Portal</span>
                  </Link>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <FirebaseConfigModal isOpen={showFirebaseModal} onClose={() => setShowFirebaseModal(false)} />
      <QrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </>
  );
};
