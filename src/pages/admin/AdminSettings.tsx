import React, { useState } from 'react';
import {
  Settings,
  Clock,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { CampusDB, runEscalationCheck } from '../../services/store';
import { isFirebaseConfigured } from '../../services/firebase';

export const AdminSettings: React.FC = () => {
  const depts = CampusDB.getDepartments();
  const initialUrgent = depts[0]?.slaHoursUrgent ?? 2;
  const initialHigh = depts[0]?.slaHoursHigh ?? 6;
  const initialMed = depts[0]?.slaHoursMedium ?? 24;
  const initialLow = depts[0]?.slaHoursLow ?? 48;

  const [slaUrgent, setSlaUrgent] = useState(initialUrgent);
  const [slaHigh, setSlaHigh] = useState(initialHigh);
  const [slaMed, setSlaMed] = useState(initialMed);
  const [slaLow, setSlaLow] = useState(initialLow);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [scanning, setScanning] = useState(false);

  const isCloud = isFirebaseConfigured();

  const handleSaveSlaSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const currentDepts = CampusDB.getDepartments();
    currentDepts.forEach((d) => {
      CampusDB.updateDepartment(d.departmentId, {
        slaHoursUrgent: slaUrgent,
        slaHoursHigh: slaHigh,
        slaHoursMedium: slaMed,
        slaHoursLow: slaLow,
      });
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRunEscalation = () => {
    setScanning(true);
    setTimeout(() => {
      const updated = runEscalationCheck();
      setScanning(false);
      setScanResult(
        updated > 0
          ? `Scan complete: ${updated} complaints passed SLA deadline and were flagged as Overdue & Escalated.`
          : 'Scan complete: No new tickets exceeded SLA deadlines.'
      );
    }, 600);
  };

  const handleResetDemoSeed = () => {
    if (confirm('Reset database to clean initial seed data? This resets all 10 complaints, 5 students, and 4 staff.')) {
      CampusDB.resetToDemoSeed();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System &amp; SLA Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Campus SLA escalation parameters, data synchronization, and testing tools
        </p>
      </div>

      {/* SLA Configuration Form */}
      <form onSubmit={handleSaveSlaSettings} className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Configurable Resolution SLA Escalation Targets</h2>
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Save Targets
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-rose-700 mb-1">Urgent Priority</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={72}
                value={slaUrgent}
                onChange={(e) => setSlaUrgent(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
              <span className="font-semibold text-slate-500">hrs</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Immediate life safety</p>
          </div>

          <div>
            <label className="block font-bold text-red-700 mb-1">High Priority</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={120}
                value={slaHigh}
                onChange={(e) => setSlaHigh(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
              <span className="font-semibold text-slate-500">hrs</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Sparks, pipe burst</p>
          </div>

          <div>
            <label className="block font-bold text-amber-700 mb-1">Medium Priority</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={240}
                value={slaMed}
                onChange={(e) => setSlaMed(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
              <span className="font-semibold text-slate-500">hrs</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">AC leak, wifi router</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Low Priority</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={500}
                value={slaLow}
                onChange={(e) => setSlaLow(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
              <span className="font-semibold text-slate-500">hrs</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Cosmetic, minor weld</p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            SLA targets successfully updated across all operational maintenance departments!
          </div>
        )}
      </form>

      {/* Escalation Engine Runner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <RefreshCw className="w-5 h-5 text-purple-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Automated SLA Escalation Scanner</h2>
            <p className="text-xs text-slate-500">
              Evaluates all pending tickets against resolution deadlines (dueAt)
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          In production, this check executes as a scheduled Google Cloud Function or Firebase cron trigger. In this prototype, click below to evaluate all active complaints against the system clock.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunEscalation}
            disabled={scanning}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Evaluating Deadlines...' : 'Run Escalation Check Now'}
          </button>
        </div>

        {scanResult && (
          <div className="p-3 bg-purple-50 text-purple-900 rounded-xl border border-purple-200 text-xs font-medium">
            {scanResult}
          </div>
        )}
      </div>

      {/* Reset Seed Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <RotateCcw className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Reset Demo Seed Data</h2>
            <p className="text-xs text-slate-500">
              Reset database to initial pristine hackathon demo dataset (5 students, 4 staff, 1 admin, 10 tickets)
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Use this to quickly reset the application state after testing student submissions, technician acceptance, or status transitions.
        </p>

        <button
          type="button"
          onClick={handleResetDemoSeed}
          className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" />
          Reset All Data to Demo Seed
        </button>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Database reset to demo state! Reloading...
          </div>
        )}
      </div>
    </div>
  );
};
