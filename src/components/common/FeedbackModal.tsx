import React, { useState } from 'react';
import { Star, X, CheckCircle, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  complaintTitle: string;
  studentId: string;
  studentName: string;
  onSubmitFeedback: (data: {
    complaintId: string;
    studentId: string;
    studentName: string;
    rating: number;
    comment: string;
    aspects: { timeliness: number; cleanliness: number; staffBehavior: number };
    verifyResolution: boolean;
  }) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  complaintId,
  complaintTitle,
  studentId,
  studentName,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [timeliness, setTimeliness] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [staffBehavior, setStaffBehavior] = useState(5);
  const [comment, setComment] = useState('');
  const [verifyResolution, setVerifyResolution] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating >= 4) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
    onSubmitFeedback({
      complaintId,
      studentId,
      studentName,
      rating,
      comment: comment.trim(),
      aspects: { timeliness, cleanliness, staffBehavior },
      verifyResolution,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Rate Maintenance Quality</h3>
              <p className="text-xs text-slate-500">{complaintId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500">Complaint</p>
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{complaintTitle}</p>
          </div>

          {/* Star selector */}
          <div className="text-center py-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Overall Experience</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        active ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {rating === 5 && 'Outstanding work! Very happy.'}
              {rating === 4 && 'Good job, problem resolved.'}
              {rating === 3 && 'Average service, acceptable.'}
              {rating === 2 && 'Needs improvement.'}
              {rating === 1 && 'Unsatisfactory response.'}
            </p>
          </div>

          {/* Sub aspects */}
          <div className="space-y-2 border-t border-b border-slate-100 py-3">
            {[
              { label: 'Promptness / Timeliness', val: timeliness, set: setTimeliness },
              { label: 'Work Area Cleanliness', val: cleanliness, set: setCleanliness },
              { label: 'Staff Politeness & Behavior', val: staffBehavior, set: setStaffBehavior },
            ].map((aspect) => (
              <div key={aspect.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{aspect.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => aspect.set(s)}
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] transition-colors ${
                        aspect.val >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Comments</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the repair quality or any suggestions..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Confirm resolution check */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 cursor-pointer">
            <input
              type="checkbox"
              checked={verifyResolution}
              onChange={(e) => setVerifyResolution(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-emerald-900 block">Confirm Problem is Fully Fixed</span>
              <span className="text-emerald-700">This will transition the complaint status to "Verified".</span>
            </div>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              Submit Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
