import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Wrench,
  Camera,
  MapPin,
  User,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { Complaint, ActivityLog, ComplaintStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ProgressStepper, ActivityTimeline } from '../../components/common/Timeline';
import { ImageUploadModal } from '../../components/common/ImageUploadModal';

export const StaffComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | undefined>(() =>
    id ? CampusDB.getComplaintById(id) : undefined
  );
  const [logs, setLogs] = useState<ActivityLog[]>(() =>
    id ? CampusDB.getActivityLogs(id) : []
  );

  // Resolution & work notes form state
  const [workNote, setWorkNote] = useState('');
  const [resolutionImages, setResolutionImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = () => {
      const found = CampusDB.getComplaintById(id);
      setComplaint(found);
      setLogs(CampusDB.getActivityLogs(id));
      if (found?.resolutionImageUrls) {
        setResolutionImages(found.resolutionImageUrls);
      }
    };

    loadData();
    const unsubC = CampusDB.subscribe('complaints', loadData);
    const unsubL = CampusDB.subscribe('activityLogs', loadData);

    return () => {
      unsubC();
      unsubL();
    };
  }, [id]);

  if (!complaint) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Complaint Not Found</h2>
        <Link
          to="/staff/assigned"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned
        </Link>
      </div>
    );
  }

  // Security: Staff can only access complaints assigned to their department or themselves
  const isAuthorized =
    currentUser?.role === 'admin' ||
    complaint.departmentId === currentUser?.departmentId ||
    complaint.assignedStaffId === currentUser?.uid;

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Department Access Restricted</h2>
        <p className="text-xs text-slate-600 mt-1">
          This complaint is routed to <strong>{complaint.departmentName}</strong>. You are currently logged in for <strong>{currentUser?.departmentName || 'another department'}</strong>.
        </p>
        <Link
          to="/staff/assigned"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Department Queue
        </Link>
      </div>
    );
  }

  const handleStatusTransition = (newStatus: ComplaintStatus, note?: string) => {
    setUpdating(true);
    try {
      CampusDB.updateComplaint(
        complaint.complaintId,
        {
          status: newStatus,
          assignedStaffId: complaint.assignedStaffId || currentUser?.uid,
          assignedStaffName: complaint.assignedStaffName || currentUser?.name,
          resolutionNote: note || complaint.resolutionNote,
          resolutionImageUrls: resolutionImages.length > 0 ? resolutionImages : complaint.resolutionImageUrls,
        },
        {
          name: currentUser?.name || 'Staff Technician',
          role: 'staff',
        },
        note || `Status shifted to ${newStatus}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workNote.trim() && !complaint.resolutionNote) {
      return;
    }

    setUpdating(true);
    try {
      CampusDB.updateComplaint(
        complaint.complaintId,
        {
          status: 'Resolved',
          resolutionNote: workNote.trim() || complaint.resolutionNote,
          resolutionImageUrls: resolutionImages,
          assignedStaffId: complaint.assignedStaffId || currentUser?.uid,
          assignedStaffName: complaint.assignedStaffName || currentUser?.name,
        },
        {
          name: currentUser?.name || 'Staff Technician',
          role: 'staff',
        },
        `Maintenance work marked as resolved by ${currentUser?.name}. Note: "${workNote.trim() || complaint.resolutionNote}"`
      );
      setWorkNote('');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/staff/assigned"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>

        {/* Workflow Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {['Submitted', 'Assigned'].includes(complaint.status) && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusTransition('Accepted', `Complaint accepted by technician ${currentUser?.name}`)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Complaint
            </button>
          )}

          {['Accepted', 'Reopened'].includes(complaint.status) && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusTransition('In Progress', `Maintenance technician started active work on site`)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              Start Work (In Progress)
            </button>
          )}

          {['In Progress', 'Accepted', 'Reopened'].includes(complaint.status) && (
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Camera className="w-4 h-4 text-indigo-600" />
              Upload Completion Photos ({resolutionImages.length})
            </button>
          )}

          {complaint.status === 'Resolved' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Status: Resolved
            </span>
          )}
        </div>
      </div>

      {/* Ticket Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {complaint.complaintId}
              </span>
              <StatusBadge status={complaint.status} isOverdue={complaint.isOverdue} />
              <PriorityBadge priority={complaint.priority} />
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                {complaint.category}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{complaint.title}</h1>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 font-mono space-y-1 shrink-0">
            <p>
              Target Deadline:{' '}
              <strong className={complaint.isOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}>
                {new Date(complaint.dueAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </p>
            {complaint.isOverdue && (
              <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded text-[10px]">
                OVERDUE ESCALATED
              </span>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <ProgressStepper status={complaint.status} />
        </div>

        {/* Student & Location Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="space-y-2">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Location Details</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">
                  {complaint.location.building}, {complaint.location.floor}, {complaint.location.roomNumber}
                </span>
                {complaint.location.specificSpot && (
                  <p className="text-slate-600 italic">Exact spot: {complaint.location.specificSpot}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Student Contact</p>
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">{complaint.studentName}</span>
                <p className="text-slate-500">{complaint.studentEmail}</p>
                {complaint.studentPhone && <p className="text-slate-500">{complaint.studentPhone}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Problem Description & Attached Photos */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Reported Issue Description
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </div>
        </div>

        {/* Student Photos */}
        {complaint.imageUrls && complaint.imageUrls.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Student Photos ({complaint.imageUrls.length})
            </p>
            <div className="flex gap-2.5 overflow-x-auto py-1">
              {complaint.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reopen note alert if reopened */}
        {complaint.reopenReason && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900">
            <span className="font-bold block mb-1">Student Reopen Explanation:</span>
            <p className="italic">"{complaint.reopenReason}"</p>
          </div>
        )}

        {/* Resolution Work Form (For Staff) */}
        {!['Verified', 'Rejected'].includes(complaint.status) && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-blue-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Complete Repair &amp; Mark as Resolved
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                + Add After-Repair Photos ({resolutionImages.length})
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maintenance Notes / Actions Taken *
                </label>
                <textarea
                  rows={3}
                  value={workNote}
                  onChange={(e) => setWorkNote(e.target.value)}
                  placeholder="e.g. Cleared clogged drain, replaced threaded pipe, tested water pressure for 10 minutes..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Photos preview */}
              {resolutionImages.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Attached Repair Proof:
                  </p>
                  <div className="flex gap-2 overflow-x-auto">
                    {resolutionImages.map((u, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={u} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setResolutionImages(resolutionImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleStatusTransition('In Progress', workNote ? `Progress Note: ${workNote}` : undefined)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Save Progress Note Only
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Task as Resolved
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Resolution Note if already marked resolved */}
        {complaint.resolutionNote && complaint.status === 'Resolved' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
            <span className="font-bold block mb-1">Submitted Resolution Note:</span>
            <p className="italic">"{complaint.resolutionNote}"</p>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Activity Audit Log</h3>
          <ActivityTimeline logs={logs} />
        </div>
      </div>

      {/* Proof Photo Upload Modal */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImagesSelected={(urls) => setResolutionImages((prev) => [...prev, ...urls])}
        title="Upload After-Repair Proof Photos"
      />
    </div>
  );
};
