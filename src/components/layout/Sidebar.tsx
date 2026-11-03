import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Bell,
  UserCheck,
  CheckCircle2,
  Clock,
  History,
  Building2,
  Users,
  BarChart3,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Sparkles,
  QrCode,
  X,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { role, currentUser } = useAuth();
  const { unreadCount } = useNotifications();

  interface NavLinkItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }

  const studentLinks: NavLinkItem[] = [
    { to: '/student', label: 'Student Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/student/create', label: 'Report New Problem', icon: <PlusCircle className="w-4 h-4 text-indigo-600" /> },
    { to: '/student/complaints', label: 'My Complaints', icon: <ListOrdered className="w-4 h-4" /> },
    {
      to: '/student/notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { to: '/student/profile', label: 'My Profile', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const staffLinks: NavLinkItem[] = [
    { to: '/staff', label: 'Staff Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/staff/assigned', label: 'Assigned Complaints', icon: <Clock className="w-4 h-4 text-blue-600" /> },
    { to: '/staff/history', label: 'Completed History', icon: <History className="w-4 h-4" /> },
    { to: '/staff/profile', label: 'Staff Profile', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const adminLinks: NavLinkItem[] = [
    { to: '/admin', label: 'Campus Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/admin/complaints', label: 'All Complaints', icon: <ListOrdered className="w-4 h-4" /> },
    { to: '/admin/departments', label: 'Manage Departments', icon: <Building2 className="w-4 h-4" /> },
    { to: '/admin/users', label: 'Manage Accounts', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/analytics', label: 'Campus Analytics', icon: <BarChart3 className="w-4 h-4 text-purple-600" /> },
    { to: '/admin/reports', label: 'Export Reports (CSV)', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> },
    { to: '/admin/settings', label: 'SLA & Escalation Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const currentLinks = role === 'admin' ? adminLinks : role === 'staff' ? staffLinks : studentLinks;

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-64">
      {/* Role Card Banner */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Workspace</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
              role === 'admin'
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : role === 'staff'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            {role || 'Student'} Portal
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2.5">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'C'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentUser?.departmentName || currentUser?.hostelInfo || currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </p>

        {currentLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/student' || link.to === '/staff' || link.to === '/admin'}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              {link.icon}
              <span>{link.label}</span>
            </div>
            {link.badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Campus Quick Access
          </p>
          <NavLink
            to="/about"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>About &amp; SLA Matrix</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer / Hotline */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Campus Emergency</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Control Room: Ext 4040 / +91 1800-CAMPUS</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-xs bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3">
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
