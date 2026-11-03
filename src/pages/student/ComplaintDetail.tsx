import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  Camera,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CampusDB } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ActivityLog, ComplaintFeedback } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ProgressStepper, ActivityTimeline } from '../../components/common/Timeline';
import { FeedbackModal } from '../../components/common/FeedbackModal';

export const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | undefined>(() =>
    id ? CampusDB.getComplaintById(id) : undefined
  );
  const [logs, setLogs] = useState<ActivityLog[]>(() =>
    id ? CampusDB.getActivityLogs(id) : []
  );
  const [feedback, setFeedback] = useState<ComplaintFeedback[]>(() =>
    id ? CampusDB.getFeedbacks(id) : []
  );

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReopenPrompt, setShowReopenPrompt] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  // Firestore onSnapshot real-time listener emulation
  useEffect(() => {
    if (!id) return;

    const loadData = () => {
      const found = CampusDB.getComplaintById(id);
      setComplaint(found);
      setLogs(CampusDB.getActivityLogs(id));
      setFeedback(CampusDB.getFeedbacks(id));
    };

    loadData();

    const unsubComplaints = CampusDB.subscribe('complaints', loadData);
    const unsubLogs = CampusDB.subscribe('activityLogs', loadData);
    const unsubFb = CampusDB.subscribe('feedback', loadData);

    return () => {
      unsubComplaints();
      unsubLogs();
      unsubFb();
    };
  }, [id]);

  if (!complaint) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Complaint Ticket Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">Ticket {id} does not exist or was removed.</p>
        <Link
          to="/student/complaints"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Complaints
        </Link>
      </div>
    );
  }

  // Student Privacy & Authorization Guard:
  // Students can only access their own complaints; Admins have oversight
  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    complaint.studentId === currentUser?.uid ||
    complaint.studentEmail?.toLowerCase() === currentUser?.email?.toLowerCase();

  if (!isOwnerOrAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Student Privacy Restricted</h2>
        <p className="text-xs text-slate-600 mt-1">
          This complaint was filed by another student. You are only authorized to view tickets associated with your student profile.
        </p>
        <Link
          to="/student/complaints"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to My Complaints
        </Link>
      </div>
    );
  }

  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      return;
    }
    setReopening(true);
    try {
      CampusDB.updateComplaint(
        complaint.complaintId,
        {
          status: 'Reopened',
          reopenReason: reopenReason.trim(),
        },
        {
          name: currentUser?.name || 'Student',
          role: 'student',
        },
        `Reopened by student: "${reopenReason.trim()}"`
      );
      setShowReopenPrompt(false);
      setReopenReason('');
    } finally {
      setReopening(false);
    }
  };

  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleFeedbackSubmit = (data: {
    complaintId: string;
    studentId: string;
    studentName: string;
    rating: number;
    comment: string;
    aspects: { timeliness: number; cleanliness: number; staffBehavior: number };
    verifyResolution: boolean;
  }) => {
    setFeedbackError(null);
    try {
      CampusDB.submitFeedback({
        complaintId: data.complaintId,
        studentId: data.studentId,
        studentName: data.studentName,
        rating: data.rating,
        comment: data.comment,
        aspects: data.aspects,
      });

      if (data.verifyResolution) {
        CampusDB.updateComplaint(
          complaint.complaintId,
          { status: 'Verified' },
          { name: currentUser?.name || 'Student', role: 'student', uid: currentUser?.uid },
          `Student verified resolution with ${data.rating}★ rating.`
        );
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to submit rating.');
    }
  };

  const hasRated = feedback.length > 0;
  const canRateOrVerify = (complaint.status === 'Resolved' || complaint.status === 'Verified') && !hasRated;
  const isVerified = complaint.status === 'Verified';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top back button & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Complaints
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {complaint.status === 'Resolved' && (
            <button
              type="button"
              onClick={() => setShowReopenPrompt(true)}
              className="px-3.5 py-1.5 rounded-xl border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Issue Not Fixed? Reopen
            </button>
          )}

          {canRateOrVerify && (
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Rate Maintenance Quality
            </button>
          )}

          {hasRated && (
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              Feedback Submitted ({feedback[0].rating}★)
            </span>
          )}

          {isVerified && (
            <span className="px-3 py-1 rounded-xl bg-green-100 text-green-800 border border-green-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-700" />
              Verified &amp; Closed
            </span>
          )}
        </div>
      </div>

      {feedbackError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {feedbackError}
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Header line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                {complaint.complaintId}
              </span>
              <StatusBadge status={complaint.status} isOverdue={complaint.isOverdue} size="md" />
              <PriorityBadge priority={complaint.priority} />
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {complaint.category}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{complaint.title}</h1>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 font-mono space-y-1 shrink-0">
            <p>
              Submitted:{' '}
              <strong className="text-slate-800">
                {new Date(complaint.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </p>
            <p>
              Last Updated:{' '}
              <strong className="text-slate-800">
                {new Date(complaint.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </p>
          </div>
        </div>

        {/* Real-time Progress Stepper */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Progress Status</p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ProgressStepper status={complaint.status} />
          </div>
        </div>

        {/* Location & Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block">Location:</span>
                <span className="font-bold text-slate-900">
                  {complaint.location.building}, {complaint.location.floor}, {complaint.location.roomNumber}
                </span>
                {complaint.location.specificSpot && (
                  <span className="text-slate-600 block mt-0.5 italic">
                    Spot: {complaint.location.specificSpot}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block">SLA Resolution Target:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {new Date(complaint.dueAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block">Assigned Department:</span>
                <span className="font-bold text-indigo-700">{complaint.departmentName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block">Assigned Staff Technician:</span>
                <span className="font-bold text-slate-900">
                  {complaint.assignedStaffName || 'Pending specific staff allocation by department head'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Description */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Problem Details</p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </div>
        </div>

        {/* Initial Issue Images */}
        {complaint.imageUrls && complaint.imageUrls.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Student Attached Photos ({complaint.imageUrls.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.imageUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity block group shadow-xs"
                >
                  <img src={url} alt="Problem proof" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Staff Maintenance Note & Resolution Photos */}
        {(complaint.resolutionNote || (complaint.resolutionImageUrls && complaint.resolutionImageUrls.length > 0)) && (
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Staff Maintenance Report &amp; Resolution Proof
              </h3>
            </div>

            {complaint.resolutionNote && (
              <p className="text-xs text-emerald-900 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                "{complaint.resolutionNote}"
              </p>
            )}

            {complaint.resolutionImageUrls && complaint.resolutionImageUrls.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  After-Repair Proof Images:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {complaint.resolutionImageUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl overflow-hidden border border-emerald-200 block shadow-xs"
                    >
                      <img src={url} alt="Fixed proof" className="w-full h-28 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing Feedback */}
        {feedback.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className="text-xs font-bold text-slate-900">Student Feedback Submitted</h3>
              </div>
              <span className="text-xs font-bold text-amber-700">{feedback[0].rating} / 5 Stars</span>
            </div>
            <p className="text-xs text-slate-700 italic">"{feedback[0].comment}"</p>
          </div>
        )}

        {/* Reopen Prompt Modal / Form */}
        {showReopenPrompt && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-bold text-orange-900">Reopen Complaint</h4>
            </div>
            <p className="text-xs text-orange-800">
              Please explain why the maintenance work was incomplete or what remains broken:
            </p>
            <form onSubmit={handleReopen} className="space-y-3">
              <textarea
                rows={3}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Switched on the fan today and the regulator is still sparking..."
                className="w-full p-2.5 text-xs rounded-xl border border-orange-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenPrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopening}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs"
                >
                  {reopening ? 'Updating...' : 'Submit Reopen Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Complete Activity &amp; Status Audit Log</h3>
          <ActivityTimeline logs={logs} />
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        complaintId={complaint.complaintId}
        complaintTitle={complaint.title}
        studentId={currentUser?.uid || 'student-aarav'}
        studentName={currentUser?.name || 'Aarav Sharma'}
        onSubmitFeedback={handleFeedbackSubmit}
      />
    </div>
  );
};
