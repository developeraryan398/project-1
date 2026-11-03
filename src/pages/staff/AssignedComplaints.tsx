import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { Complaint, ComplaintStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const AssignedComplaints: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterTab, setFilterTab] = useState<'All' | 'MyJobs' | 'Accepted' | 'InProgress' | 'Overdue'>(
    (searchParams.get('filter') as any) || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = () => {
      const all = CampusDB.getComplaints();
      const deptComplaints = all.filter((c) => {
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

  const filtered = complaints.filter((c) => {
    if (filterTab === 'MyJobs' && c.assignedStaffId !== currentUser?.uid) return false;
    if (filterTab === 'Accepted' && c.status !== 'Accepted') return false;
    if (filterTab === 'InProgress' && c.status !== 'In Progress') return false;
    if (filterTab === 'Overdue' && !c.isOverdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.complaintId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.building.toLowerCase().includes(q) ||
        c.location.roomNumber.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleQuickStatusUpdate = (e: React.MouseEvent, c: Complaint, newStatus: ComplaintStatus, note: string) => {
    e.stopPropagation();
    CampusDB.updateComplaint(
      c.complaintId,
      {
        status: newStatus,
        assignedStaffId: c.assignedStaffId || currentUser?.uid,
        assignedStaffName: c.assignedStaffName || currentUser?.name,
      },
      {
        name: currentUser?.name || 'Staff Technician',
        role: 'staff',
      },
      note
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assigned Work Tickets</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {currentUser?.departmentName} • Maintenance tickets allocated to your department
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'All', label: 'All Dept Tickets', count: complaints.length },
            { id: 'MyJobs', label: 'My Direct Tickets', count: complaints.filter((c) => c.assignedStaffId === currentUser?.uid).length },
            { id: 'Accepted', label: 'Accepted', count: complaints.filter((c) => c.status === 'Accepted').length },
            { id: 'InProgress', label: 'In Progress', count: complaints.filter((c) => c.status === 'In Progress').length },
            { id: 'Overdue', label: 'Overdue SLA', count: complaints.filter((c) => c.isOverdue).length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, location, or student name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Ticket Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No work tickets match your filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.complaintId}
              onClick={() => navigate(`/staff/complaints/${item.complaintId}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {item.complaintId}
                    </span>
                    <StatusBadge status={item.status} isOverdue={item.isOverdue} />
                    <PriorityBadge priority={item.priority} size="sm" />
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location.building} • {item.location.roomNumber}
                    </span>
                    <span>•</span>
                    <span>Student: {item.studentName}</span>
                    <span>•</span>
                    <span>
                      Assigned: <strong>{item.assignedStaffName || 'None'}</strong>
                    </span>
                  </div>
                </div>

                {/* Quick actions for staff */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                  {['Submitted', 'Assigned'].includes(item.status) && (
                    <button
                      type="button"
                      onClick={(e) =>
                        handleQuickStatusUpdate(e, item, 'Accepted', `Ticket accepted by technician ${currentUser?.name}`)
                      }
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Accept Task
                    </button>
                  )}

                  {['Accepted', 'Reopened'].includes(item.status) && (
                    <button
                      type="button"
                      onClick={(e) =>
                        handleQuickStatusUpdate(e, item, 'In Progress', `Technician started active maintenance work`)
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Start Work
                    </button>
                  )}

                  {item.status === 'In Progress' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/staff/complaints/${item.complaintId}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Resolve
                    </button>
                  )}

                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform pl-2">
                    Open Details <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
