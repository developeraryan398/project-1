import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, CheckCircle2, MapPin, Calendar, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const StaffWorkHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const load = () => {
      const all = CampusDB.getComplaints();
      const resolved = all.filter(
        (c) =>
          ['Resolved', 'Verified'].includes(c.status) &&
          (c.departmentId === currentUser?.departmentId || c.assignedStaffId === currentUser?.uid)
      );
      setComplaints(resolved);
    };

    load();
    const unsubscribe = CampusDB.subscribe('complaints', load);
    return unsubscribe;
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Completed Work History</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Archived maintenance records for {currentUser?.departmentName}
        </p>
      </div>

      <div className="space-y-3">
        {complaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No resolved tickets archived yet.
          </div>
        ) : (
          complaints.map((item) => (
            <div
              key={item.complaintId}
              onClick={() => navigate(`/staff/complaints/${item.complaintId}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.complaintId}
                    </span>
                    <StatusBadge status={item.status} />
                    <PriorityBadge priority={item.priority} size="sm" />
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>

                  {item.resolutionNote && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      Resolution: "{item.resolutionNote}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location.building} • {item.location.roomNumber}
                    </span>
                    <span>•</span>
                    <span>Student: {item.studentName}</span>
                    <span>•</span>
                    <span>Technician: {item.assignedStaffName || 'Team'}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Resolved: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Done'}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Record <ChevronRight className="w-4 h-4" />
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
