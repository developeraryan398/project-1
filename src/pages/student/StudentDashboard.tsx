import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  QrCode,
  Zap,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { QrCodeModal } from '../../components/common/QrCodeModal';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const load = () => {
      const all = CampusDB.getComplaints();
      const myComplaints = all.filter((c) => c.studentId === currentUser?.uid || c.studentEmail === currentUser?.email);
      setComplaints(myComplaints);
    };

    load();

    const unsubscribe = CampusDB.subscribe('complaints', load);
    return unsubscribe;
  }, [currentUser]);

  const total = complaints.length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Accepted').length;
  const pending = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Assigned' || c.status === 'Reopened').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Verified').length;

  const activeComplaints = complaints.filter((c) => !['Verified', 'Rejected'].includes(c.status));

  return (
    <div className="space-y-6">
      {/* Welcome & Actions Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Student Support Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {currentUser?.name || 'Student'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
              {currentUser?.hostelInfo || 'Campus Resident'} • Report campus faults and track live technician updates until resolution.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs flex items-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4 text-indigo-300" />
              Scan QR
            </button>

            <Link
              to="/student/create"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Filed</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lifetime reports</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-amber-600">Pending / Assigned</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pending}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting start</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-blue-600">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Technician active</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600">Resolved</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{resolved}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fixed &amp; verified</p>
        </div>
      </div>

      {/* Active Complaints List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Campus Complaints</h2>
            <p className="text-xs text-slate-500">Live real-time status from Firestore</p>
          </div>
          <Link
            to="/student/complaints"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All ({complaints.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeComplaints.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">All clear! No active complaints.</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Everything in your room and campus facilities is currently in good order. Found an issue?
            </p>
            <Link
              to="/student/create"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report New Issue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeComplaints.map((item) => (
              <div
                key={item.complaintId}
                onClick={() => navigate(`/student/complaints/${item.complaintId}`)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {item.complaintId}
                      </span>
                      <StatusBadge status={item.status} isOverdue={item.isOverdue} />
                      <PriorityBadge priority={item.priority} size="sm" />
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location.building} • {item.location.roomNumber}
                      </span>
                      <span>•</span>
                      <span>Assigned to: <strong className="text-slate-700">{item.departmentName}</strong></span>
                      {item.assignedStaffName && (
                        <>
                          <span>•</span>
                          <span>Technician: <strong className="text-indigo-700">{item.assignedStaffName}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Track Live <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onSelectLocation={(loc) => {
          navigate(
            `/student/create?area=${encodeURIComponent(loc.campusArea)}&bld=${encodeURIComponent(loc.building)}&fl=${encodeURIComponent(loc.floor)}&rm=${encodeURIComponent(loc.roomNumber)}`
          );
        }}
      />
    </div>
  );
};
