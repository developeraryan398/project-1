import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Wrench,
  UserCheck,
  Building,
  Mail,
  Phone,
  X,
  CheckCircle2,
  Edit,
  Save,
  GraduationCap,
} from 'lucide-react';
import { CampusDB } from '../../services/store';
import { UserProfile, UserRole, Department } from '../../types';

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleFilter, setRoleFilter] = useState<'All' | 'student' | 'staff' | 'admin'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add User modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [deptId, setDeptId] = useState('');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [hostelInfo, setHostelInfo] = useState('');

  // Edit User modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editHostel, setEditHostel] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');

  useEffect(() => {
    const load = () => {
      setUsers(CampusDB.getUsers());
      setDepartments(CampusDB.getDepartments());
    };

    load();
    const unsubU = CampusDB.subscribe('users', load);
    const unsubD = CampusDB.subscribe('departments', load);

    return () => {
      unsubU();
      unsubD();
    };
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return;
    }

    const deptObj = departments.find((d) => d.departmentId === deptId);
    const newUid = `${newRole}-${Date.now()}`;

    CampusDB.addUser(
      {
        uid: newUid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: newRole,
        departmentId: newRole === 'staff' ? (deptId || 'dept-general') : undefined,
        departmentName: newRole === 'staff' ? (deptObj?.name || 'General Maintenance Department') : undefined,
        phone: phone.trim() || '+91 98000 11111',
        rollNumber: newRole === 'student' ? (rollNumber.trim() || `STU-${Date.now().toString().slice(-4)}`) : undefined,
        hostelInfo: newRole === 'student' ? (hostelInfo.trim() || 'Hostel A - Room 101') : undefined,
        createdAt: new Date().toISOString(),
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      },
      { role: 'admin' }
    );

    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
    setRollNumber('');
    setHostelInfo('');
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditDeptId(user.departmentId || departments[0]?.departmentId || '');
    setEditHostel(user.hostelInfo || '');
    setEditRole(user.role);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const deptObj = departments.find((d) => d.departmentId === editDeptId);

    CampusDB.updateUser(
      editingUser.uid,
      {
        name: editName.trim() || editingUser.name,
        phone: editPhone.trim() || editingUser.phone,
        role: editRole,
        departmentId: editRole === 'staff' ? editDeptId : undefined,
        departmentName: editRole === 'staff' ? deptObj?.name : undefined,
        hostelInfo: editRole === 'student' ? editHostel : undefined,
      },
      { role: 'admin' }
    );

    setEditingUser(null);
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
        (u.hostelInfo && u.hostelInfo.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus User Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, technician accounts, and administrative roles
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDeptId(departments[0]?.departmentId || '');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-start"
        >
          <UserPlus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Accounts</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600">Students</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {users.filter((u) => u.role === 'student').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-blue-600">Technicians</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {users.filter((u) => u.role === 'staff').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-purple-600">Administrators</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">
            {users.filter((u) => u.role === 'admin').length}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2">
          {(['All', 'student', 'staff', 'admin'] as const).map((r) => {
            const count = r === 'All' ? users.length : users.filter((u) => u.role === r).length;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  roleFilter === r ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'All' ? 'All Accounts' : r} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name, roll number, department, hostel, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Hostel Info</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">UID</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : u.role === 'staff'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {u.departmentName || u.hostelInfo || (u.rollNumber ? `Roll: ${u.rollNumber}` : 'Campus General')}
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {u.phone || '—'}
                  </td>

                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    {u.uid}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Campus Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('staff')}
                    className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                      newRole === 'staff'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Maintenance Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('student')}
                    className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                      newRole === 'student'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campus Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@campusfix.edu"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              {newRole === 'staff' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allocated Department *</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Roll / Student ID</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 2024-CS-112"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hostel &amp; Room</label>
                    <input
                      type="text"
                      value={hostelInfo}
                      onChange={(e) => setHostelInfo(e.target.value)}
                      placeholder="e.g. Ganga Hostel, Room 304"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Account Settings</h3>
                <p className="text-xs text-slate-500 font-mono">{editingUser.uid}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="staff">Maintenance Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {editRole === 'staff' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
                  <select
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editRole === 'student' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hostel &amp; Room</label>
                  <input
                    type="text"
                    value={editHostel}
                    onChange={(e) => setEditHostel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
