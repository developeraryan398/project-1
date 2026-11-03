import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  ShieldCheck,
  Zap,
  Droplets,
  Wind,
  Wifi,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  QrCode,
  Flame,
  Building,
  UserCheck,
  ChevronRight,
  TrendingUp,
  BarChart,
} from 'lucide-react';
import { CampusDB } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { QrCodeModal } from '../../components/common/QrCodeModal';

export const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState(CampusDB.getComplaints());
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const unsubscribe = CampusDB.subscribe('complaints', () => {
      setComplaints(CampusDB.getComplaints());
    });
    return unsubscribe;
  }, []);

  const total = complaints.length;
  const resolved = complaints.filter((c) => ['Resolved', 'Verified'].includes(c.status)).length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-16 sm:py-24">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Next-Generation College Infrastructure Automation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Campus<span className="text-indigo-400">Fix</span>
          </h1>

          <p className="mt-3 text-xl sm:text-2xl font-bold tracking-wide text-indigo-200">
            Report It. Track It. Fix It.
          </p>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Centralized campus maintenance connecting students, specialized technician staff, and university administration in real time.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/student/create"
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              Report Campus Problem
            </Link>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-xs flex items-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4 text-indigo-300" />
              Scan Location QR
            </button>

            <Link
              to="/login"
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition-all"
            >
              Sign In to CampusFix
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live Counter Stats */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{total}</p>
              <p className="text-xs text-slate-400 mt-1">Total Reported</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{resolved}</p>
              <p className="text-xs text-slate-400 mt-1">Issues Resolved</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{inProgress}</p>
              <p className="text-xs text-slate-400 mt-1">Active In Progress</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{resolutionRate}%</p>
              <p className="text-xs text-slate-400 mt-1">Resolution Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Role Portals Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-8 relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Student Portal</h3>
              <p className="text-xs text-slate-500 mt-1">
                Report hostel &amp; classroom faults in 30 seconds. Track live progress, view technician photos, and confirm resolution.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Auto-routing to correct department
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Live Firestore onSnapshot tracker
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  1-Click reopen if unresolved
                </li>
              </ul>
            </div>
            <Link
              to="/student"
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              Access Student Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Staff */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Staff Technician Portal</h3>
              <p className="text-xs text-slate-500 mt-1">
                Department-specific queue for electrical, plumbing, AC, housekeeping, and IT technicians with SLA countdown.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Accept &amp; start maintenance tickets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Upload Before &amp; After proof photos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Overdue deadline alert alerts
                </li>
              </ul>
            </div>
            <Link
              to="/staff"
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              Staff Technician Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Campus Administration</h3>
              <p className="text-xs text-slate-500 mt-1">
                University-wide oversight, staff assignment, SLA enforcement, emergency escalation, and CSV exports.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Real-time interactive Recharts analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Department &amp; user management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Export audited CSV reports
                </li>
              </ul>
            </div>
            <Link
              to="/admin"
              className="mt-6 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              Campus Administration Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Complaint Categories Section */}
      <section className="py-12 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Supported Campus Categories</h2>
            <p className="text-sm text-slate-500 mt-1">
              Every category is instantly auto-routed to its dedicated response team
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: 'Electricity', icon: <Zap className="w-5 h-5 text-amber-500" />, dept: 'Electrical Dept' },
              { name: 'Plumbing', icon: <Droplets className="w-5 h-5 text-blue-500" />, dept: 'Plumbing Dept' },
              { name: 'Water Leakage', icon: <Droplets className="w-5 h-5 text-cyan-500" />, dept: 'Plumbing Dept' },
              { name: 'Washroom Cleaning', icon: <Sparkles className="w-5 h-5 text-emerald-500" />, dept: 'Housekeeping' },
              { name: 'Room Cleaning', icon: <Sparkles className="w-5 h-5 text-teal-500" />, dept: 'Housekeeping' },
              { name: 'AC and Cooling', icon: <Wind className="w-5 h-5 text-sky-500" />, dept: 'AC Maintenance' },
              { name: 'Furniture / Benches', icon: <Wrench className="w-5 h-5 text-orange-500" />, dept: 'Furniture Dept' },
              { name: 'Internet and Wi-Fi', icon: <Wifi className="w-5 h-5 text-indigo-500" />, dept: 'IT Support' },
              { name: 'Hostel Maintenance', icon: <Building className="w-5 h-5 text-purple-500" />, dept: 'General Maint.' },
              { name: 'Other Issues', icon: <ShieldCheck className="w-5 h-5 text-slate-500" />, dept: 'General Maint.' },
            ].map((cat) => (
              <div
                key={cat.name}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all bg-slate-50/50"
              >
                <div className="mb-2">{cat.icon}</div>
                <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">→ {cat.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Modal */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onSelectLocation={(loc) => {
          navigate(
            `/student/create?area=${encodeURIComponent(loc.campusArea)}&bld=${encodeURIComponent(loc.building)}&fl=${encodeURIComponent(loc.floor)}&rm=${encodeURIComponent(loc.roomNumber)}`
          );
        }}
      />
    </div>
  );
};
