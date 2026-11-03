import React from 'react';
import { ComplaintStatus, ActivityLog } from '../../types';
import { CheckCircle2, Clock, AlertCircle, Wrench, ShieldAlert, CornerUpLeft } from 'lucide-react';

interface TimelineProps {
  currentStatus: ComplaintStatus;
  activityLogs: ActivityLog[];
}

export const ProgressStepper: React.FC<{ status: ComplaintStatus }> = ({ status }) => {
  const steps: ComplaintStatus[] = ['Submitted', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Verified'];
  const isRejected = status === 'Rejected';
  const isReopened = status === 'Reopened';

  // Find index of current status
  const currentIdx = steps.indexOf(status);

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: isRejected
              ? '100%'
              : isReopened
              ? '60%'
              : currentIdx >= 0
              ? `${(currentIdx / (steps.length - 1)) * 100}%`
              : '0%',
            backgroundColor: isRejected ? '#e11d48' : isReopened ? '#ea580c' : '#4f46e5',
          }}
        />

        {steps.map((step, idx) => {
          const isPassed = currentIdx >= idx;
          const isCurrent = currentIdx === idx && !isRejected && !isReopened;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all shadow-xs ${
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 scale-110'
                    : isPassed
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isPassed && !isCurrent ? <CheckCircle2 className="w-4 h-4 text-indigo-600" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-medium mt-2 text-center max-w-[70px] truncate ${
                  isCurrent ? 'text-indigo-900 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {isReopened && (
        <div className="mt-4 p-2.5 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2 text-xs text-orange-800">
          <CornerUpLeft className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            <strong>Complaint Reopened:</strong> Issue was not resolved to student satisfaction. Re-routed for maintenance intervention.
          </span>
        </div>
      )}

      {isRejected && (
        <div className="mt-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Complaint Closed/Rejected:</strong> Marked invalid or duplicate by administration.
          </span>
        </div>
      )}
    </div>
  );
};

export const ActivityTimeline: React.FC<{ logs: ActivityLog[] }> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-slate-500 py-4 italic">No activity logs recorded yet.</p>;
  }

  // Sort latest first
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((log) => {
        const timeFormatted = new Date(log.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const roleColor = {
          student: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          staff: 'bg-blue-100 text-blue-800 border-blue-200',
          admin: 'bg-purple-100 text-purple-800 border-purple-200',
        }[log.updatedByRole] || 'bg-slate-100 text-slate-700';

        return (
          <div key={log.logId} className="relative group">
            {/* Timeline bullet */}
            <div className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform" />

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{log.action}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${roleColor}`}>
                    {log.updatedByRole.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {timeFormatted}
                </span>
              </div>

              <div className="mt-1.5 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-slate-800">{log.updatedBy}</span>
                {log.updatedByUid && (
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    UID: {log.updatedByUid}
                  </span>
                )}
                {log.oldStatus && log.newStatus && log.oldStatus !== log.newStatus && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <span className="line-through">{log.oldStatus}</span> →{' '}
                    <span className="text-indigo-700 font-semibold">{log.newStatus}</span>
                  </span>
                )}
              </div>

              {log.note && (
                <div className="mt-2 text-xs bg-slate-50 text-slate-700 p-2 rounded-lg border border-slate-100 italic">
                  "{log.note}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
