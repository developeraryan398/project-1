import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccessDeniedPage: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'staff') navigate('/staff');
    else navigate('/student');
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/90 shadow-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            403 Forbidden • Access Denied
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Unauthorized Portal Access
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your current campus account does not possess the required security privileges or department authorization to access this area.
          </p>
        </div>

        {/* Identity Details Card */}
        {currentUser ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Authenticated User:</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold">Campus Email:</span>
              <span className="font-mono text-[11px] text-slate-700">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Assigned Role:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : role === 'staff'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {role}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
            No active campus session detected. Please sign in to verify your authorization.
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {currentUser ? (
            <>
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Return to My Authorized Dashboard
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out &amp; Use Different Account
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              Sign In to CampusFix
            </Link>
          )}

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Campus Home
          </Link>
        </div>
      </div>
    </div>
  );
};
