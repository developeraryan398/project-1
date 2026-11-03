import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  ShieldAlert,
  Search,
  Eye,
} from 'lucide-react';
import { CampusDB } from '../../services/store';
import { Complaint, Department } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const AdminReports: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const load = () => {
      setComplaints(CampusDB.getComplaints());
      setDepartments(CampusDB.getDepartments());
    };

    load();
    const unsubC = CampusDB.subscribe('complaints', load);
    const unsubD = CampusDB.subscribe('departments', load);

    return () => {
      unsubC();
      unsubD();
    };
  }, []);

  const getFilteredComplaints = () => {
    return complaints.filter((c) => {
      if (selectedDept !== 'All' && c.departmentId !== selectedDept) return false;
      if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;
      return true;
    });
  };

  const handleExportCSV = () => {
    const list = getFilteredComplaints();

    // CSV header row
    const headers = [
      'Ticket ID',
      'Title',
      'Category',
      'Campus Area',
      'Building',
      'Floor',
      'Room',
      'Priority',
      'Status',
      'Student Name',
      'Student Email',
      'Department Name',
      'Assigned Technician',
      'Created At',
      'SLA Due At',
      'Resolved At',
      'Is Overdue',
      'Resolution Notes',
    ];

    // Escape CSV cell value
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map((c) => [
      escapeCSV(c.complaintId),
      escapeCSV(c.title),
      escapeCSV(c.category),
      escapeCSV(c.location.campusArea),
      escapeCSV(c.location.building),
      escapeCSV(c.location.floor),
      escapeCSV(c.location.roomNumber),
      escapeCSV(c.priority),
      escapeCSV(c.status),
      escapeCSV(c.studentName),
      escapeCSV(c.studentEmail),
      escapeCSV(c.departmentName),
      escapeCSV(c.assignedStaffName || 'Unassigned'),
      escapeCSV(c.createdAt),
      escapeCSV(c.dueAt),
      escapeCSV(c.resolvedAt || ''),
      escapeCSV(c.isOverdue ? 'YES' : 'NO'),
      escapeCSV(c.resolutionNote || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CampusFix_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const filteredList = getFilteredComplaints();
  const filteredCount = filteredList.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Reports &amp; CSV Export</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate comprehensive tabular audit records for university administration reviews and institutional accreditation
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Custom Export Filter Parameters</h2>
            <p className="text-xs text-slate-500">Filter dataset before downloading or previewing records</p>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
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
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="All">All Statuses</option>
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
            <label className="block font-bold text-slate-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Summary Card & Download Trigger */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 block">
              Records Ready for Export: <strong className="text-emerald-700 text-sm">{filteredCount}</strong> / {complaints.length}
            </span>
            <span className="text-slate-500 text-[11px]">
              Includes ticket ID, student details, location, resolution notes, timestamps, and SLA audit flags.
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredCount === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Download CSV Report
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            CSV file downloaded successfully!
          </div>
        )}

        {/* Live Preview Table */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Data Preview ({filteredCount} records)
            </h3>
            <span className="text-[11px] text-slate-400">First 10 records shown below</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Issue Title</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.slice(0, 10).map((c) => (
                    <tr key={c.complaintId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{c.complaintId}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate font-medium text-slate-800">{c.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.location.building} • {c.location.roomNumber}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.departmentName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.studentName}</td>
                      <td className="py-2.5 px-3">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={c.status} isOverdue={c.isOverdue} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
