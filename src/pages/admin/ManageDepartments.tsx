import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Users,
  Clock,
  Edit,
  X,
  CheckCircle2,
  Zap,
  Droplets,
  Wind,
  Wifi,
  Wrench,
  Shield,
  Save,
} from 'lucide-react';
import { CampusDB } from '../../services/store';
import { Department, UserProfile, ComplaintCategory } from '../../types';

export const ManageDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState(CampusDB.getComplaints());

  // Add Department Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadEmail, setNewHeadEmail] = useState('');
  const [slaHigh, setSlaHigh] = useState(6);
  const [slaMed, setSlaMed] = useState(18);
  const [slaLow, setSlaLow] = useState(36);

  // Edit Department Modal
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editHeadName, setEditHeadName] = useState('');
  const [editHeadEmail, setEditHeadEmail] = useState('');
  const [editSlaHigh, setEditSlaHigh] = useState(6);
  const [editSlaMed, setEditSlaMed] = useState(18);
  const [editSlaLow, setEditSlaLow] = useState(36);

  useEffect(() => {
    const load = () => {
      setDepartments(CampusDB.getDepartments());
      setStaffUsers(CampusDB.getUsers().filter((u) => u.role === 'staff'));
      setComplaints(CampusDB.getComplaints());
    };

    load();
    const unsubD = CampusDB.subscribe('departments', load);
    const unsubU = CampusDB.subscribe('users', load);
    const unsubC = CampusDB.subscribe('complaints', load);

    return () => {
      unsubD();
      unsubU();
      unsubC();
    };
  }, []);

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      return;
    }

    const deptId = `dept-${newDeptCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    CampusDB.addDepartment({
      departmentId: deptId,
      name: newDeptName.trim(),
      code: newDeptCode.trim().toUpperCase(),
      categories: ['Other Issues'],
      staffIds: [],
      headName: newHeadName.trim() || 'Department Head',
      headEmail: newHeadEmail.trim() || `${deptId}@campusfix.edu`,
      slaHoursHigh: Number(slaHigh),
      slaHoursMedium: Number(slaMed),
      slaHoursLow: Number(slaLow),
    });

    setShowAddModal(false);
    setNewDeptName('');
    setNewDeptCode('');
    setNewHeadName('');
    setNewHeadEmail('');
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setEditHeadName(dept.headName);
    setEditHeadEmail(dept.headEmail);
    setEditSlaHigh(dept.slaHoursHigh);
    setEditSlaMed(dept.slaHoursMedium);
    setEditSlaLow(dept.slaHoursLow);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    CampusDB.updateDepartment(editingDept.departmentId, {
      headName: editHeadName.trim() || editingDept.headName,
      headEmail: editHeadEmail.trim() || editingDept.headEmail,
      slaHoursHigh: Number(editSlaHigh),
      slaHoursMedium: Number(editSlaMed),
      slaHoursLow: Number(editSlaLow),
    });

    setEditingDept(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Maintenance Departments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure campus service units, technician allocations, and SLA resolution hours
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptStaff = staffUsers.filter(
            (s) => s.departmentId === dept.departmentId || dept.staffIds.includes(s.uid)
          );
          const activeCount = complaints.filter(
            (c) => c.departmentId === dept.departmentId && !['Resolved', 'Verified'].includes(c.status)
          ).length;
          const resolvedCount = complaints.filter(
            (c) => c.departmentId === dept.departmentId && ['Resolved', 'Verified'].includes(c.status)
          ).length;

          return (
            <div
              key={dept.departmentId}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        CODE: {dept.code}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(dept)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Edit Department"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {/* Head & categories */}
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Dept Head:</span>
                    <strong className="text-slate-800">{dept.headName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Email:</span>
                    <span className="font-mono text-slate-600">{dept.headEmail}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold block mb-0.5">Handled Categories:</span>
                    <span className="text-slate-700 font-medium">{dept.categories.join(', ')}</span>
                  </div>
                </div>

                {/* SLA Targets */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">SLA Deadlines</p>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="bg-red-50 p-1.5 rounded-lg border border-red-100">
                      <span className="block font-bold text-red-700">{dept.slaHoursHigh}h</span>
                      <span className="text-[9px] text-red-500">High</span>
                    </div>
                    <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                      <span className="block font-bold text-amber-700">{dept.slaHoursMedium}h</span>
                      <span className="text-[9px] text-amber-500">Medium</span>
                    </div>
                    <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                      <span className="block font-bold text-slate-700">{dept.slaHoursLow}h</span>
                      <span className="text-[9px] text-slate-500">Low</span>
                    </div>
                  </div>
                </div>

                {/* Active Crew */}
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Assigned Technicians ({deptStaff.length})
                  </p>
                  {deptStaff.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No direct staff allocated yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {deptStaff.map((s) => (
                        <div key={s.uid} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50">
                          <span className="font-semibold text-slate-800">{s.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{s.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Workload footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-amber-700 font-bold">{activeCount} Active</span>
                <span className="text-emerald-700 font-bold">{resolvedCount} Resolved</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Maintenance Department</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Elevator &amp; Lift Services"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    placeholder="LIFT"
                    className="w-full p-2.5 rounded-xl border border-slate-200 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head Name</label>
                  <input
                    type="text"
                    value={newHeadName}
                    onChange={(e) => setNewHeadName(e.target.value)}
                    placeholder="Officer In-Charge"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head Email</label>
                <input
                  type="email"
                  value={newHeadEmail}
                  onChange={(e) => setNewHeadEmail(e.target.value)}
                  placeholder="head.lift@campusfix.edu"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">High SLA (h)</label>
                  <input
                    type="number"
                    value={slaHigh}
                    onChange={(e) => setSlaHigh(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Med SLA (h)</label>
                  <input
                    type="number"
                    value={slaMed}
                    onChange={(e) => setSlaMed(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Low SLA (h)</label>
                  <input
                    type="number"
                    value={slaLow}
                    onChange={(e) => setSlaLow(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Department Settings</h3>
                <p className="text-xs text-slate-500">{editingDept.name} ({editingDept.code})</p>
              </div>
              <button onClick={() => setEditingDept(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Head Name</label>
                <input
                  type="text"
                  required
                  value={editHeadName}
                  onChange={(e) => setEditHeadName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Head Email</label>
                <input
                  type="email"
                  required
                  value={editHeadEmail}
                  onChange={(e) => setEditHeadEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">High SLA (h)</label>
                  <input
                    type="number"
                    value={editSlaHigh}
                    onChange={(e) => setEditSlaHigh(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Med SLA (h)</label>
                  <input
                    type="number"
                    value={editSlaMed}
                    onChange={(e) => setEditSlaMed(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Low SLA (h)</label>
                  <input
                    type="number"
                    value={editSlaLow}
                    onChange={(e) => setEditSlaLow(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
