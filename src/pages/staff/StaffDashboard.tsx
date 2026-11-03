import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  Flame,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  User,
  Phone,
  Mail,
  Camera,
  X,
  Check,
  Building,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { Complaint, ComplaintStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ImageUploadModal } from '../../components/common/ImageUploadModal';

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'overdue'>('all');

  // Quick Resolve Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [quickResolutionNote, setQuickResolutionNote] = useState('');
  const [quickResolutionImages, setQuickResolutionImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    const load = () => {
      const all = CampusDB.getComplaints();
      // Department-level security filtering:
      // Staff only sees complaints assigned to their department or themselves
      const deptComplaints = all.filter((c) => {
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.departmentId && c.departmentId === currentUser.departmentId) return true;
        if (c.assignedStaffId === currentUser?.uid) return true;
        return false;
      });
      setComplaints(deptComplaints);
    };

    load();
    const unsubscribe = CampusDB.subscribe('complaints', load);
    return unsubscribe;
  }, [currentUser]);

  // Statistics calculation
  const pendingTasks = complaints.filter((c) => ['Submitted', 'Assigned', 'Reopened'].includes(c.status));
  const inProgressTasks = complaints.filter((c) => ['Accepted', 'In Progress'].includes(c.status));
  const resolvedTasks = complaints.filter((c) => ['Resolved', 'Verified'].includes(c.status));
  const overdueTasks = complaints.filter((c) => c.isOverdue && !['Resolved', 'Verified'].includes(c.status));

  // Filtered queue
  const displayQueue = complaints.filter((c) => {
    if (filterTab === 'pending') return ['Submitted', 'Assigned', 'Reopened'].includes(c.status);
    if (filterTab === 'in_progress') return ['Accepted', 'In Progress'].includes(c.status);
    if (filterTab === 'resolved') return ['Resolved', 'Verified'].includes(c.status);
    if (filterTab === 'overdue') return c.isOverdue && !['Resolved', 'Verified'].includes(c.status);
    return true; // 'all'
  });

  // Action: Accept Complaint
  const handleAccept = (e: React.MouseEvent, c: Complaint) => {
    e.stopPropagation();
    CampusDB.updateComplaint(
      c.complaintId,
      {
        status: 'Accepted',
        assignedStaffId: c.assignedStaffId || currentUser?.uid,
        assignedStaffName: c.assignedStaffName || currentUser?.name,
      },
      {
        name: currentUser?.name || 'Staff Technician',
        role: 'staff',
        uid: currentUser?.uid,
      },
      `Complaint ticket accepted by technician ${currentUser?.name} (${currentUser?.departmentName})`
    );
  };

  // Action: Start Work
  const handleStartWork = (e: React.MouseEvent, c: Complaint) => {
    e.stopPropagation();
    CampusDB.updateComplaint(
      c.complaintId,
      {
        status: 'In Progress',
        assignedStaffId: c.assignedStaffId || currentUser?.uid,
        assignedStaffName: c.assignedStaffName || currentUser?.name,
      },
      {
        name: currentUser?.name || 'Staff Technician',
        role: 'staff',
        uid: currentUser?.uid,
      },
      `Maintenance crew started active repair work on ${c.complaintId}`
    );
  };

  // Action: Open Quick Resolve Modal
  const openResolveModal = (e: React.MouseEvent, c: Complaint) => {
    e.stopPropagation();
    setResolvingComplaint(c);
    setQuickResolutionNote(c.resolutionNote || '');
    setQuickResolutionImages(c.resolutionImageUrls || []);
  };

  // Submit Resolution
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    if (!quickResolutionNote.trim()) {
      return;
    }

    setSubmittingResolution(true);
    try {
      CampusDB.updateComplaint(
        resolvingComplaint.complaintId,
        {
          status: 'Resolved',
          resolutionNote: quickResolutionNote.trim(),
          resolutionImageUrls: quickResolutionImages,
          assignedStaffId: resolvingComplaint.assignedStaffId || currentUser?.uid,
          assignedStaffName: resolvingComplaint.assignedStaffName || currentUser?.name,
        },
        {
          name: currentUser?.name || 'Staff Technician',
          role: 'staff',
          uid: currentUser?.uid,
        },
        `Complaint marked as resolved by technician ${currentUser?.name}. Note: "${quickResolutionNote.trim()}"`
      );
      setResolvingComplaint(null);
      setQuickResolutionNote('');
      setQuickResolutionImages([]);
    } finally {
      setSubmittingResolution(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Staff Profile & Department Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentUser?.departmentName || 'Maintenance Department'}</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentUser?.name || 'Staff Technician'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500 text-white uppercase tracking-wider">
                Staff Verified
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Managing tickets for <strong>{currentUser?.departmentName}</strong>. Accept tickets, log real-time maintenance updates, upload completion photos, and resolve campus issues.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                {currentUser?.email}
              </span>
              {currentUser?.phone && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  {currentUser?.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              to="/staff/assigned"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Clock className="w-4 h-4" />
              Manage All Dept Tickets ({complaints.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Task Statistics Section (Requirement 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setFilterTab('pending')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-amber-400 ${
            filterTab === 'pending' ? 'ring-2 ring-amber-400 border-amber-300' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700">Pending Tasks</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingTasks.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Submitted &amp; Reopened</p>
        </div>

        {/* In Progress Card */}
        <div
          onClick={() => setFilterTab('in_progress')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-blue-400 ${
            filterTab === 'in_progress' ? 'ring-2 ring-blue-400 border-blue-300' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700">In Progress</p>
            <Wrench className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{inProgressTasks.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Under active repair</p>
        </div>

        {/* Resolved Card */}
        <div
          onClick={() => setFilterTab('resolved')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-emerald-400 ${
            filterTab === 'resolved' ? 'ring-2 ring-emerald-400 border-emerald-300' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700">Resolved Tasks</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedTasks.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed &amp; verified</p>
        </div>

        {/* Overdue Card */}
        <div
          onClick={() => setFilterTab('overdue')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-rose-400 ${
            filterTab === 'overdue' ? 'ring-2 ring-rose-400 border-rose-300' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-700">Overdue SLA</p>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{overdueTasks.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Passed SLA deadline</p>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-sm block">
                {overdueTasks.length} Urgent Maintenance {overdueTasks.length === 1 ? 'Job is' : 'Jobs are'} Overdue!
              </span>
              <p className="text-rose-700 mt-0.5">
                Resolution target has been exceeded. Please review and complete these tickets to maintain campus SLA compliance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterTab('overdue')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            Filter Overdue ({overdueTasks.length})
          </button>
        </div>
      )}

      {/* Department Complaint Queue Header & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {currentUser?.departmentName} Queue
            </h2>
            <p className="text-xs text-slate-500">
              Department-filtered tickets synced in real time with Firestore
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All', count: complaints.length },
              { id: 'pending', label: 'Pending', count: pendingTasks.length },
              { id: 'in_progress', label: 'In Progress', count: inProgressTasks.length },
              { id: 'resolved', label: 'Resolved', count: resolvedTasks.length },
              { id: 'overdue', label: 'Overdue', count: overdueTasks.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List with Full Details & Action Buttons (Requirements 4, 5, 6, 7, 8, 9) */}
        {displayQueue.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No complaints in this queue view</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select another filter tab or wait for new student reports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayQueue.map((item) => (
              <div
                key={item.complaintId}
                onClick={() => navigate(`/staff/complaints/${item.complaintId}`)}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group space-y-3.5"
              >
                {/* Top Row: Ticket ID, Status, Priority, Category, Deadline */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {item.complaintId}
                    </span>
                    <StatusBadge status={item.status} isOverdue={item.isOverdue} />
                    <PriorityBadge priority={item.priority} size="sm" />
                    <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Deadline:{' '}
                    <strong className={item.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                      {new Date(item.dueAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                </div>

                {/* Complaint Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Location & Student Contact Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">
                        {item.location.building} • {item.location.floor} • {item.location.roomNumber}
                      </span>
                      {item.location.specificSpot && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          Spot: {item.location.specificSpot}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">
                        Student: {item.studentName}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {item.studentEmail} {item.studentPhone ? `• ${item.studentPhone}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resolution note if already resolved */}
                {item.resolutionNote && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <strong>Technician Resolution Note:</strong> "{item.resolutionNote}"
                  </div>
                )}

                {/* Bottom Action Controls: Accept, Start Work, Resolve, Details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Assigned: <strong className="text-slate-700">{item.assignedStaffName || 'Department General Pool'}</strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Button 1: Accept Complaint (Requirement 5) */}
                    {['Submitted', 'Assigned'].includes(item.status) && (
                      <button
                        type="button"
                        onClick={(e) => handleAccept(e, item)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept Complaint
                      </button>
                    )}

                    {/* Button 2: Start Work to change status to In Progress (Requirement 6) */}
                    {['Accepted', 'Reopened'].includes(item.status) && (
                      <button
                        type="button"
                        onClick={(e) => handleStartWork(e, item)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Start Work (In Progress)
                      </button>
                    )}

                    {/* Button 3: Resolve Complaint (Requirement 7) */}
                    {['In Progress', 'Accepted', 'Reopened'].includes(item.status) && (
                      <button
                        type="button"
                        onClick={(e) => openResolveModal(e, item)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve Complaint
                      </button>
                    )}

                    {/* Full details link */}
                    <button
                      type="button"
                      onClick={() => navigate(`/staff/complaints/${item.complaintId}`)}
                      className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Full Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Resolve Modal (Requirements 7, 8, 9, 12, 13, 14) */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Resolve Complaint</h3>
                  <p className="text-xs text-slate-500 font-mono">{resolvingComplaint.complaintId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900">{resolvingComplaint.title}</p>
                <p className="text-slate-500 mt-0.5">
                  {resolvingComplaint.location.building} • {resolvingComplaint.location.roomNumber} • Student: {resolvingComplaint.studentName}
                </p>
              </div>

              {/* Maintenance Notes (Requirement 8) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Maintenance Completion Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={quickResolutionNote}
                  onChange={(e) => setQuickResolutionNote(e.target.value)}
                  placeholder="Detail parts replaced, cleaning actions, pressure test conducted..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Uploading Completion Photographs (Requirement 9) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Completion Photographs</label>
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    + Attach Photos ({quickResolutionImages.length})
                  </button>
                </div>

                {quickResolutionImages.length === 0 ? (
                  <div
                    onClick={() => setShowImageModal(true)}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 cursor-pointer text-center text-slate-500 bg-slate-50/50"
                  >
                    <Camera className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <span>Upload completion photos or choose demo after-repair proof</span>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {quickResolutionImages.map((imgUrl, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                        <img src={imgUrl} alt="Fixed" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setQuickResolutionImages(quickResolutionImages.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingResolution ? 'Updating Firestore...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Photo Upload Modal */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImagesSelected={(urls) => setQuickResolutionImages((prev) => [...prev, ...urls])}
        title="Upload Completion Photographs"
      />
    </div>
  );
};
