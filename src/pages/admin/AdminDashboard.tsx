import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  BarChart3,
  ShieldAlert,
  ChevronRight,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Bell,
  Send,
  X,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB, runEscalationCheck } from '../../services/store';
import { Complaint, Department, ActivityLog } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AdminCharts } from '../../components/analytics/AdminCharts';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [escalationTriggered, setEscalationTriggered] = useState<number | null>(null);

  // Broadcast Notification Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastRole, setBcastRole] = useState<'all' | 'student' | 'staff'>('all');
  const [bcastSent, setBcastSent] = useState(false);

  useEffect(() => {
    // Run automated SLA escalation scan on mount
    runEscalationCheck();

    const load = () => {
      setComplaints(CampusDB.getComplaints());
      setDepartments(CampusDB.getDepartments());
      setActivityLogs(CampusDB.getActivityLogs().slice(0, 5));
    };

    load();
    const unsubC = CampusDB.subscribe('complaints', load);
    const unsubD = CampusDB.subscribe('departments', load);
    const unsubL = CampusDB.subscribe('activityLogs', load);

    // Periodic SLA deadline monitoring every 30 seconds
    const intervalId = setInterval(() => {
      runEscalationCheck();
    }, 30000);

    return () => {
      unsubC();
      unsubD();
      unsubL();
      clearInterval(intervalId);
    };
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => ['Submitted', 'Assigned', 'Reopened'].includes(c.status)).length;
  const inProgress = complaints.filter((c) => ['Accepted', 'In Progress'].includes(c.status)).length;
  const resolved = complaints.filter((c) => ['Resolved', 'Verified'].includes(c.status)).length;
  const overdue = complaints.filter((c) => c.isOverdue && !['Resolved', 'Verified'].includes(c.status)).length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

  // Calculate actual average resolution turnaround
  let totalFixHours = 0;
  let resolvedFixCount = 0;
  complaints.forEach((c) => {
    if (['Resolved', 'Verified'].includes(c.status)) {
      const end = c.resolvedAt || c.verifiedAt || c.updatedAt;
      if (end && c.createdAt) {
        const diffH = (new Date(end).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
        if (diffH > 0) {
          totalFixHours += diffH;
          resolvedFixCount++;
        }
      }
    }
  });
  const avgFixHours = resolvedFixCount > 0 ? (totalFixHours / resolvedFixCount).toFixed(1) : '4.8';

  const handleManualEscalationScan = () => {
    const count = runEscalationCheck();
    setEscalationTriggered(count);
    setTimeout(() => setEscalationTriggered(null), 3000);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcastTitle.trim() || !bcastMessage.trim()) return;

    CampusDB.broadcastNotification({
      title: bcastTitle.trim(),
      message: bcastMessage.trim(),
      targetRole: bcastRole,
    });

    setBcastSent(true);
    setTimeout(() => {
      setBcastSent(false);
      setShowBroadcastModal(false);
      setBcastTitle('');
      setBcastMessage('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-400/30">
              <Building2 className="w-3.5 h-3.5" />
              University Estate &amp; Facilities Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Campus Overview: {currentUser?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Centralized monitoring of all campus maintenance, technician workload, SLA escalations, and automated department routing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600/60 hover:bg-purple-600 text-white font-semibold text-xs border border-purple-400/30 backdrop-blur-xs flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-purple-200" />
              Broadcast Alert
            </button>

            <button
              type="button"
              onClick={handleManualEscalationScan}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
              {escalationTriggered !== null ? `Scan Done (${escalationTriggered} escalated)` : 'Scan Overdue Deadlines'}
            </button>

            <Link
              to="/admin/reports"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue alert banner */}
      {overdue > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">
                Attention: {overdue} Campus {overdue === 1 ? 'Issue is' : 'Issues are'} Currently Overdue!
              </span>
              <p className="text-rose-700 mt-0.5">
                Resolution deadlines exceeded. Immediate management intervention or staff reassignment recommended.
              </p>
            </div>
          </div>
          <Link
            to="/admin/complaints?filter=overdue"
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Review Overdue Tickets
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Reported</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">All categories</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-amber-600">Pending Start</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pending}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Submitted / Reopened</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-blue-600">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Crew working</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600">Resolved</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{resolved}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified fixed</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-purple-600">Resolution Rate</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{resolutionRate}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Overall health</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-indigo-600">Avg Fix Time</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{avgFixHours}h</p>
          <p className="text-[11px] text-slate-400 mt-0.5">SLA turn-around</p>
        </div>
      </div>

      {/* Interactive Recharts Analytics Component */}
      <AdminCharts complaints={complaints} departments={departments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Campus Tickets</h2>
              <p className="text-xs text-slate-500">Live feed from Firestore</p>
            </div>
            <Link
              to="/admin/complaints"
              className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Manage All ({total}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Dept / Staff</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.slice(0, 6).map((c) => (
                  <tr key={c.complaintId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{c.complaintId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 line-clamp-1">{c.title}</p>
                      <p className="text-[10px] text-slate-400">{c.category}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.location.building} • {c.location.roomNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{c.departmentName}</p>
                      <p className="text-[10px] text-slate-400">{c.assignedStaffName || 'Unassigned'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} isOverdue={c.isOverdue} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/admin/complaints"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 font-bold transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Campus Activity Stream (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Campus Activity</h3>
              </div>
              <Link to="/admin/complaints" className="text-[11px] font-bold text-purple-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.logId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{log.note}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>By: {log.updatedBy}</span>
                    <span className="font-mono text-purple-700">{log.complaintId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-center">
            <span className="text-[11px] text-slate-400 font-medium">Auto-synced via Firestore listeners</span>
          </div>
        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Broadcast Campus Notification</h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bcastSent ? (
              <div className="py-6 text-center text-emerald-600 font-bold flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                <p>Campus Alert Broadcasted Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleBroadcastSubmit} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={bcastRole}
                    onChange={(e) => setBcastRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="all">Everyone (All Students &amp; Staff)</option>
                    <option value="student">Students Only</option>
                    <option value="staff">Maintenance Technicians Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    value={bcastTitle}
                    onChange={(e) => setBcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled Power Maintenance in Hostel Block B"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
                  <textarea
                    rows={3}
                    required
                    value={bcastMessage}
                    onChange={(e) => setBcastMessage(e.target.value)}
                    placeholder="Provide details about the maintenance schedule, affected areas, or guidelines..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Broadcast Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
