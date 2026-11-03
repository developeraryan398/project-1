import React, { useState } from 'react';
import { UserCheck, Mail, Building, Phone, Wrench, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';

export const StaffProfile: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saved, setSaved] = useState(false);

  const deptTickets = CampusDB.getComplaints().filter(
    (c) => c.departmentId === currentUser?.departmentId || c.assignedStaffId === currentUser?.uid
  );

  const resolvedCount = deptTickets.filter((c) => ['Resolved', 'Verified'].includes(c.status)).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
              {currentUser?.name?.charAt(0) || 'T'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentUser?.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                Technician
              </span>
            </div>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">{currentUser?.departmentName}</p>
            <p className="text-[11px] text-slate-400 font-mono">{currentUser?.email}</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-lg font-bold text-slate-900">{deptTickets.length}</p>
            <p className="text-[11px] text-slate-500">Dept Workload</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-lg font-bold text-emerald-700">{resolvedCount}</p>
            <p className="text-[11px] text-emerald-600">Fixed &amp; Closed</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-lg font-bold text-blue-700">
              {deptTickets.filter((c) => c.assignedStaffId === currentUser?.uid).length}
            </p>
            <p className="text-[11px] text-blue-600">Personal Tickets</p>
          </div>
        </div>

        {/* Edit details */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Technician Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Department (Admin Assigned)</label>
            <input
              type="text"
              disabled
              value={currentUser?.departmentName || 'Maintenance'}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Profile Updated!
              </span>
            ) : (
              <span className="text-slate-400">Settings save to active session</span>
            )}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
