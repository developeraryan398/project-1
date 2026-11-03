import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { INITIAL_DEPARTMENTS } from '../../services/autoAssign';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
          <Wrench className="w-3.5 h-3.5" />
          University Facility Service Level Agreement
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About CampusFix</h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Tagline: <strong>"Report It. Track It. Fix It."</strong>
          <br />
          Bridging students, technical ground crew, and college estate management on a single real-time platform.
        </p>
      </div>

      {/* SLA Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Department SLA &amp; Resolution Targets</h2>
            <p className="text-xs text-slate-500">Configured maximum hours before automated emergency escalation</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Active SLA Rules
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Primary Categories</th>
                <th className="py-3 px-4 text-red-600">High Priority (Emergency)</th>
                <th className="py-3 px-4 text-amber-600">Medium Priority</th>
                <th className="py-3 px-4 text-slate-600">Low Priority</th>
                <th className="py-3 px-4">Dept Head</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {INITIAL_DEPARTMENTS.map((dept) => (
                <tr key={dept.departmentId} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                  <td className="py-3 px-4 text-slate-600">{dept.categories.join(', ')}</td>
                  <td className="py-3 px-4 text-red-700 font-bold">{dept.slaHoursHigh} Hours</td>
                  <td className="py-3 px-4 text-amber-700 font-semibold">{dept.slaHoursMedium} Hours</td>
                  <td className="py-3 px-4 text-slate-600">{dept.slaHoursLow} Hours</td>
                  <td className="py-3 px-4 text-slate-500">{dept.headName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900">Auto-Routing</h3>
          <p className="text-xs text-slate-500 mt-1">
            When a student selects a category, CampusFix uses deterministic routing to dispatch the complaint immediately to the responsible maintenance department and available technician.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
            2
          </div>
          <h3 className="text-sm font-bold text-slate-900">Deadline Monitoring</h3>
          <p className="text-xs text-slate-500 mt-1">
            Every ticket computes a strict deadline based on priority. If a job remains uncompleted past its SLA deadline, the automated escalation scanner flags it on the Admin overview.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
            3
          </div>
          <h3 className="text-sm font-bold text-slate-900">Dual Proof &amp; Verification</h3>
          <p className="text-xs text-slate-500 mt-1">
            Technicians attach Before &amp; After proof photos. Students inspect the work and confirm resolution or 1-click reopen if dissatisfied.
          </p>
        </div>
      </div>

      {/* Emergency Hotline Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold">24x7 Campus Infrastructure Emergency</h3>
          </div>
          <p className="text-xs text-slate-300">
            For major gas leaks, electrical fires, or severe flooding, contact the campus master control station directly.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:1800226787"
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            Call Emergency (Ext 4040)
          </a>
        </div>
      </div>
    </div>
  );
};
