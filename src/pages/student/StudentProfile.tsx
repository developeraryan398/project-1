import React, { useState } from 'react';
import { UserCheck, Mail, Building, Phone, Hash, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';

export const StudentProfile: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [hostelInfo, setHostelInfo] = useState(currentUser?.hostelInfo || '');
  const [rollNumber, setRollNumber] = useState(currentUser?.rollNumber || '');
  const [saved, setSaved] = useState(false);

  const myComplaints = CampusDB.getComplaints().filter((c) => c.studentId === currentUser?.uid || c.studentEmail === currentUser?.email);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name,
      phone,
      hostelInfo,
      rollNumber,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
              {currentUser?.name?.charAt(0) || 'S'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentUser?.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-lg font-bold text-slate-900">{myComplaints.length}</p>
            <p className="text-[11px] text-slate-500">Reported</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-lg font-bold text-emerald-700">
              {myComplaints.filter((c) => ['Resolved', 'Verified'].includes(c.status)).length}
            </p>
            <p className="text-[11px] text-emerald-600">Fixed</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-lg font-bold text-blue-700">
              {myComplaints.filter((c) => ['In Progress', 'Accepted'].includes(c.status)).length}
            </p>
            <p className="text-[11px] text-blue-600">Active</p>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Roll / Student ID</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hostel Room &amp; Block</label>
            <input
              type="text"
              value={hostelInfo}
              onChange={(e) => setHostelInfo(e.target.value)}
              placeholder="e.g. Hostel Block B, Room 304"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Profile Updated!
              </span>
            ) : (
              <span className="text-slate-400">Settings save to local session</span>
            )}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
