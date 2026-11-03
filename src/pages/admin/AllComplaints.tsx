import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  UserCheck,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  MapPin,
  Calendar,
  X,
  Edit,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Eye,
  History,
  Send,
  Camera,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CampusDB } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { Complaint, Department, UserProfile, ComplaintStatus, ComplaintPriority, ActivityLog } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ProgressStepper, ActivityTimeline } from '../../components/common/Timeline';

export const AllComplaints: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[]>([]);

  // View Mode: 'table' or 'audit_stream'
  const [viewMode, setViewMode] = useState<'table' | 'audit_stream'>('table');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('filter') === 'overdue' ? 'Overdue' : 'All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'due' | 'priority'>('newest');

  // Detailed Complaint Inspection Modal / Drawer
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  const [complaintLogs, setComplaintLogs] = useState<ActivityLog[]>([]);

  // Reassignment Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [targetStaffId, setTargetStaffId] = useState('');
  const [targetPriority, setTargetPriority] = useState<ComplaintPriority>('Medium');
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>('Assigned');
  const [adminNote, setAdminNote] = useState('');

  // Send Direct Notification Modal
  const [notifRecipient, setNotifRecipient] = useState<{ id: string; name: string; complaintId?: string } | null>(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifSentNotice, setNotifSentNotice] = useState(false);

  useEffect(() => {
    const load = () => {
      const allC = CampusDB.getComplaints();
      setComplaints(allC);
      setDepartments(CampusDB.getDepartments());
      setStaffUsers(CampusDB.getUsers().filter((u) => u.role === 'staff'));
      setAllActivityLogs(CampusDB.getActivityLogs());

      // If currently viewing a complaint, refresh its live copy and logs
      if (viewingComplaint) {
        const fresh = allC.find((c) => c.complaintId === viewingComplaint.complaintId);
        if (fresh) {
          setViewingComplaint(fresh);
          setComplaintLogs(CampusDB.getActivityLogs(fresh.complaintId));
        }
      }
    };

    load();
    const unsubC = CampusDB.subscribe('complaints', load);
    const unsubD = CampusDB.subscribe('departments', load);
    const unsubU = CampusDB.subscribe('users', load);
    const unsubL = CampusDB.subscribe('activityLogs', load);

    return () => {
      unsubC();
      unsubD();
      unsubU();
      unsubL();
    };
  }, [viewingComplaint?.complaintId]);

  const openViewComplaint = (c: Complaint) => {
    setViewingComplaint(c);
    setComplaintLogs(CampusDB.getActivityLogs(c.complaintId));
  };

  const openReassignModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setTargetDeptId(c.departmentId);
    setTargetStaffId(c.assignedStaffId || '');
    setTargetPriority(c.priority);
    setTargetStatus(c.status);
    setAdminNote('');
  };

  const handleSaveReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const deptObj = departments.find((d) => d.departmentId === targetDeptId);
    const staffObj = staffUsers.find((s) => s.uid === targetStaffId);

    const updated = CampusDB.updateComplaint(
      selectedComplaint.complaintId,
      {
        departmentId: targetDeptId,
        departmentName: deptObj?.name || selectedComplaint.departmentName,
        assignedStaffId: targetStaffId || undefined,
        assignedStaffName: staffObj?.name || (targetStaffId ? targetStaffId : undefined),
        priority: targetPriority,
        status: targetStatus,
      },
      {
        name: currentUser?.name || 'Administrator',
        role: 'admin',
        uid: currentUser?.uid,
      },
      adminNote.trim() || `Administrative assignment and priority update by ${currentUser?.name}`
    );

    if (viewingComplaint && viewingComplaint.complaintId === selectedComplaint.complaintId) {
      setViewingComplaint(updated);
    }

    setSelectedComplaint(null);
  };

  const handleSendDirectNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifRecipient || !notifTitle.trim() || !notifMessage.trim()) return;

    CampusDB.sendNotification({
      userId: notifRecipient.id,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      complaintId: notifRecipient.complaintId,
      type: 'status_update',
    });

    setNotifSentNotice(true);
    setTimeout(() => {
      setNotifSentNotice(false);
      setNotifRecipient(null);
      setNotifTitle('');
      setNotifMessage('');
    }, 1500);
  };

  // Filter complaints
  const filtered = complaints
    .filter((c) => {
      if (statusFilter === 'Overdue' && !c.isOverdue) return false;
      if (statusFilter !== 'All' && statusFilter !== 'Overdue' && c.status !== statusFilter) return false;
      if (deptFilter !== 'All' && c.departmentId !== deptFilter) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.complaintId.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q) ||
          c.location.building.toLowerCase().includes(q) ||
          c.location.roomNumber.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'due') return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Complaints Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized monitoring, department reassignment, priority escalations, and complete audit trail
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tickets ({complaints.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('audit_stream')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'audit_stream' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Campus Activity Stream ({allActivityLogs.length})
            </button>
          </div>

          <Link
            to="/admin/reports"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV Export
          </Link>
        </div>
      </div>

      {viewMode === 'audit_stream' ? (
        /* Campus Activity Stream */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Campus Event Audit Stream</h2>
              <p className="text-xs text-slate-500">Real-time chronicle of all complaints, status transitions, and notes</p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {allActivityLogs.length} Total Audit Records
            </span>
          </div>

          <div className="max-w-3xl">
            <ActivityTimeline logs={allActivityLogs} />
          </div>
        </div>
      ) : (
        /* Master Table Mode */
        <>
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All Statuses ({complaints.length})</option>
                  <option value="Overdue">Overdue SLA ({complaints.filter((c) => c.isOverdue).length})</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Accepted">Accepted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Verified">Verified</option>
                  <option value="Reopened">Reopened</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="due">SLA Due Date</option>
                  <option value="priority">Priority Severity</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search Tickets</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ID, location, student..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Master Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Problem</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department &amp; Staff</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SLA Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No complaints match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr
                        key={item.complaintId}
                        onClick={() => openViewComplaint(item)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-700 whitespace-nowrap">
                          {item.complaintId}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.category}</p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {item.location.building} • {item.location.roomNumber}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{item.studentName}</p>
                          <p className="text-[10px] text-slate-400">{item.studentEmail}</p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{item.departmentName}</p>
                          <p className="text-[10px] text-purple-700 font-medium">
                            {item.assignedStaffName || 'Unassigned Technician'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <PriorityBadge priority={item.priority} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={item.status} isOverdue={item.isOverdue} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          <span className={item.isOverdue ? 'text-red-600 font-bold' : ''}>
                            {new Date(item.dueAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openViewComplaint(item)}
                              title="Inspect Ticket & Activity"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openReassignModal(item)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Ticket Details & Timeline Drawer / Modal */}
      {viewingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                    {viewingComplaint.complaintId}
                  </span>
                  <StatusBadge status={viewingComplaint.status} isOverdue={viewingComplaint.isOverdue} />
                  <PriorityBadge priority={viewingComplaint.priority} />
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    {viewingComplaint.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{viewingComplaint.title}</h2>
              </div>
              <button
                onClick={() => setViewingComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ProgressStepper status={viewingComplaint.status} />
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="space-y-1.5">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Location Details</p>
                <p className="font-bold text-slate-900">
                  {viewingComplaint.location.building}, Floor {viewingComplaint.location.floor}, Room {viewingComplaint.location.roomNumber}
                </p>
                {viewingComplaint.location.specificSpot && (
                  <p className="text-slate-600 italic">Spot: {viewingComplaint.location.specificSpot}</p>
                )}
                <p className="text-slate-500">Area: {viewingComplaint.location.campusArea}</p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Student &amp; Routing</p>
                <p className="text-slate-900">
                  Student: <strong>{viewingComplaint.studentName}</strong> ({viewingComplaint.studentEmail})
                </p>
                <p className="text-slate-900">
                  Department: <strong className="text-purple-700">{viewingComplaint.departmentName}</strong>
                </p>
                <p className="text-slate-900">
                  Assigned Staff: <strong>{viewingComplaint.assignedStaffName || 'Unassigned'}</strong>
                </p>
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Problem Description</p>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewingComplaint.description}
              </div>
            </div>

            {/* Student Attached Photos */}
            {viewingComplaint.imageUrls && viewingComplaint.imageUrls.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Student Issue Photos ({viewingComplaint.imageUrls.length})
                </p>
                <div className="flex gap-2.5 overflow-x-auto py-1">
                  {viewingComplaint.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={url} alt="Proof" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Maintenance Report & Photos */}
            {(viewingComplaint.resolutionNote || (viewingComplaint.resolutionImageUrls && viewingComplaint.resolutionImageUrls.length > 0)) && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Technician Work Completion Report
                </div>
                {viewingComplaint.resolutionNote && (
                  <p className="text-emerald-900 italic bg-white p-2.5 rounded-lg border border-emerald-100">
                    "{viewingComplaint.resolutionNote}"
                  </p>
                )}
                {viewingComplaint.resolutionImageUrls && viewingComplaint.resolutionImageUrls.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                      After-Repair Completion Photos:
                    </p>
                    <div className="flex gap-2 overflow-x-auto">
                      {viewingComplaint.resolutionImageUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border border-emerald-200 shrink-0">
                          <img src={url} alt="Repair photo" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Escalation History Track */}
            {viewingComplaint.escalationHistory && viewingComplaint.escalationHistory.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  SLA Escalation History ({viewingComplaint.escalationHistory.length} Event{viewingComplaint.escalationHistory.length > 1 ? 's' : ''})
                </div>
                <div className="space-y-2 divide-y divide-rose-200/60">
                  {viewingComplaint.escalationHistory.map((esc, i) => (
                    <div key={i} className="pt-2 text-rose-900">
                      <p className="font-semibold text-rose-950">{esc.reason}</p>
                      <div className="flex items-center gap-2 text-[10px] text-rose-700 mt-0.5">
                        <span>Triggered by: <strong>{esc.triggeredBy}</strong></span>
                        <span>•</span>
                        <span>{new Date(esc.escalatedAt).toLocaleString()}</span>
                        {esc.hoursOverdue && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-rose-800">{esc.hoursOverdue}h overdue</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReassignModal(viewingComplaint)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Reassign / Change Priority
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setNotifRecipient({
                      id: viewingComplaint.studentId,
                      name: viewingComplaint.studentName,
                      complaintId: viewingComplaint.complaintId,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4 text-purple-600" />
                  Notify Student
                </button>

                {viewingComplaint.assignedStaffId && (
                  <button
                    type="button"
                    onClick={() =>
                      setNotifRecipient({
                        id: viewingComplaint.assignedStaffId!,
                        name: viewingComplaint.assignedStaffName || 'Assigned Technician',
                        complaintId: viewingComplaint.complaintId,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-4 h-4 text-blue-600" />
                    Notify Staff
                  </button>
                )}
              </div>

              <span className="text-[10px] font-mono text-slate-400">
                Created: {new Date(viewingComplaint.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Complete Ticket Activity Audit Log */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Ticket Activity Timeline</h3>
              <ActivityTimeline logs={complaintLogs} />
            </div>
          </div>
        </div>
      )}

      {/* Reassign / Manage Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reassign / Update Ticket</h3>
                  <p className="text-xs text-slate-500">{selectedComplaint.complaintId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReassignment} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900">{selectedComplaint.title}</p>
                <p className="text-slate-500 mt-0.5">
                  {selectedComplaint.location.building} • {selectedComplaint.location.roomNumber}
                </p>
              </div>

              {/* Department selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Maintenance Department</label>
                <select
                  value={targetDeptId}
                  onChange={(e) => {
                    setTargetDeptId(e.target.value);
                    setTargetStaffId(''); // reset staff if dept changes
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Technician Allocation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Specific Technician</label>
                <select
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Leave unassigned (auto-pool)</option>
                  {staffUsers
                    .filter((s) => !targetDeptId || s.departmentId === targetDeptId)
                    .map((s) => (
                      <option key={s.uid} value={s.uid}>
                        {s.name} ({s.departmentName || 'Staff'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Priority & Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Set Priority</label>
                  <select
                    value={targetPriority}
                    onChange={(e) => setTargetPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Critical Safety SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Override Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Accepted">Accepted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Verified">Verified</option>
                    <option value="Reopened">Reopened</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Activity Note</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Reallocated to Electrical for high-voltage testing"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save &amp; Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Direct Notification Modal */}
      {notifRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Send Notification to {notifRecipient.name}</h3>
              </div>
              <button onClick={() => setNotifRecipient(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {notifSentNotice ? (
              <div className="py-6 text-center text-emerald-600 font-bold flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                <p>Notification sent and broadcasted live!</p>
              </div>
            ) : (
              <form onSubmit={handleSendDirectNotification} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notification Title *</label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g. Additional Details Needed"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
                  <textarea
                    rows={3}
                    required
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Write a clear note that will appear in the user's notification bell and pop-up toast..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNotifRecipient(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Send Now
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
