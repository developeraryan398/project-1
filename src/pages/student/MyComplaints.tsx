import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { Complaint, ComplaintStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const MyComplaints: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterTab, setFilterTab] = useState<'All' | 'Active' | 'Resolved' | 'Overdue'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    const load = () => {
      const all = CampusDB.getComplaints();
      const myItems = all.filter((c) => c.studentId === currentUser?.uid || c.studentEmail === currentUser?.email);
      setComplaints(myItems);
    };

    load();
    const unsubscribe = CampusDB.subscribe('complaints', load);
    return unsubscribe;
  }, [currentUser]);

  // Filtering
  const filtered = complaints.filter((c) => {
    // Tab filter
    if (filterTab === 'Active' && ['Resolved', 'Verified', 'Rejected'].includes(c.status)) return false;
    if (filterTab === 'Resolved' && !['Resolved', 'Verified'].includes(c.status)) return false;
    if (filterTab === 'Overdue' && !c.isOverdue) return false;

    // Category filter
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.complaintId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.building.toLowerCase().includes(q) ||
        c.location.roomNumber.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Complaint History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status tracking for all problems reported by your student profile
          </p>
        </div>

        <Link
          to="/student/create"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Report New Problem
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['All', 'Active', 'Resolved', 'Overdue'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? complaints.length
                : tab === 'Active'
                ? complaints.filter((c) => !['Resolved', 'Verified', 'Rejected'].includes(c.status)).length
                : tab === 'Resolved'
                ? complaints.filter((c) => ['Resolved', 'Verified'].includes(c.status)).length
                : complaints.filter((c) => c.isOverdue).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterTab === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID (e.g. CF-2026-1001), keyword, or location..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Categories</option>
              <option value="Electricity">Electricity</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Washroom Cleaning">Washroom Cleaning</option>
              <option value="Room Cleaning">Room Cleaning</option>
              <option value="AC and Cooling">AC and Cooling</option>
              <option value="Furniture and Broken Benches">Furniture</option>
              <option value="Internet and Wi-Fi">Internet &amp; Wi-Fi</option>
              <option value="Hostel Maintenance">Hostel Maintenance</option>
              <option value="Other Issues">Other Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-sm font-bold text-slate-700">No complaints found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.complaintId}
              onClick={() => navigate(`/student/complaints/${item.complaintId}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {item.complaintId}
                    </span>
                    <StatusBadge status={item.status} isOverdue={item.isOverdue} />
                    <PriorityBadge priority={item.priority} size="sm" />
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location.building} • {item.location.roomNumber}
                    </span>
                    <span>•</span>
                    <span>Dept: <strong>{item.departmentName}</strong></span>
                    {item.assignedStaffName && (
                      <>
                        <span>•</span>
                        <span>Staff: <strong className="text-indigo-700">{item.assignedStaffName}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Filed: {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                      Deadline: {new Date(item.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Live Tracker <ChevronRight className="w-4 h-4" />
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
