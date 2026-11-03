import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Wrench,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Info,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type PortalRole = 'admin' | 'staff' | 'student';

export const LoginPage: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUrl = searchParams.get('redirect');
  const initialRoleParam = searchParams.get('portal') as PortalRole | null;

  // Selected portal view tab (guides input & quick access, but single unified backend auth)
  const [activePortal, setActivePortal] = useState<PortalRole>(() => {
    if (initialRoleParam === 'staff' || initialRoleParam === 'student' || initialRoleParam === 'admin') {
      return initialRoleParam;
    }
    if (redirectUrl?.startsWith('/admin')) return 'admin';
    if (redirectUrl?.startsWith('/staff')) return 'staff';
    if (redirectUrl?.startsWith('/student')) return 'student';
    return 'admin';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authSuccessRole, setAuthSuccessRole] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Info guide state
  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);

  // When switching portals, clear error and optionally pre-suggest email
  const handlePortalChange = (portal: PortalRole) => {
    setActivePortal(portal);
    setError('');
    if (portal === 'admin' && !email) {
      setEmail('admin@campusfix.edu');
      setPassword('password123');
    } else if (portal === 'staff' && !email) {
      setEmail('rajesh.electric@campusfix.edu');
      setPassword('password123');
    } else if (portal === 'student' && !email) {
      setEmail('student@campusfix.edu');
      setPassword('password123');
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string = 'password123') => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your campus email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success && result.user) {
        setAuthSuccessRole(result.user.role);

        // Brief delay for visual confirmation of role authorization
        setTimeout(() => {
          // If specific authorized redirect was requested and role matches
          if (redirectUrl) {
            if (redirectUrl.startsWith('/admin') && result.user.role === 'admin') {
              navigate(redirectUrl);
              return;
            }
            if (redirectUrl.startsWith('/staff') && (result.user.role === 'staff' || result.user.role === 'admin')) {
              navigate(redirectUrl);
              return;
            }
            if (redirectUrl.startsWith('/student')) {
              navigate(redirectUrl);
              return;
            }
          }

          // Strict role-based destination routing
          if (result.user.role === 'admin') {
            navigate('/admin');
          } else if (result.user.role === 'staff') {
            navigate('/staff');
          } else {
            navigate('/student');
          }
        }, 300);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your campus email address.');
      return;
    }

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotSuccess(true);
      setTimeout(() => {
        setForgotSuccess(false);
        setShowForgotModal(false);
        setForgotEmail('');
      }, 3000);
    } catch (err: any) {
      setForgotError(err?.message || 'Unable to process password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5 text-indigo-300" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            Campus<span className="text-indigo-600">Fix</span>
          </span>
        </Link>
        <h2 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">Unified Campus Portal</h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Secure authentication for University Administration, Maintenance Staff &amp; Students
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-xl border border-slate-200/80 sm:rounded-3xl sm:px-8">
          {/* Portal Selector Tabs */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Select Workspace Portal
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handlePortalChange('admin')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activePortal === 'admin'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalChange('staff')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activePortal === 'staff'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalChange('student')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activePortal === 'student'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
            </div>
          </div>

          {/* Portal Context Header Banner */}
          <div
            className={`mb-5 p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-colors ${
              activePortal === 'admin'
                ? 'bg-purple-50/80 border-purple-200 text-purple-900'
                : activePortal === 'staff'
                ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {activePortal === 'admin' && <Shield className="w-4 h-4 text-purple-600" />}
              {activePortal === 'staff' && <Wrench className="w-4 h-4 text-blue-600" />}
              {activePortal === 'student' && <GraduationCap className="w-4 h-4 text-emerald-600" />}
            </div>
            <div>
              <p className="font-bold text-xs">
                {activePortal === 'admin' && 'Campus Administration & Management'}
                {activePortal === 'staff' && 'Maintenance Technician Workspace'}
                {activePortal === 'student' && 'Student Fault Reporting & Tracking'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                {activePortal === 'admin' &&
                  'Full management dashboard with ticket dispatch, SLA escalations, analytics, and department control.'}
                {activePortal === 'staff' &&
                  'Department ticket queue for electrical, plumbing, AC, IT, and housekeeping work orders.'}
                {activePortal === 'student' &&
                  'Report hostel and classroom maintenance issues in under 30 seconds and track live status.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {authSuccessRole && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Verified as {authSuccessRole.toUpperCase()}. Redirecting to authorized dashboard...</span>
            </div>
          )}

          {/* Unified Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activePortal === 'admin'
                      ? 'admin@campusfix.edu or aryan2008dbg@gmail.com'
                      : activePortal === 'staff'
                      ? 'rajesh.electric@campusfix.edu'
                      : 'student@campusfix.edu'
                  }
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                activePortal === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  : activePortal === 'staff'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials &amp; Role...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {activePortal === 'admin' && 'Sign In to Management Dashboard'}
                    {activePortal === 'staff' && 'Sign In to Staff Workspace'}
                    {activePortal === 'student' && 'Sign In to Student Portal'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Quick-fill 1-click test credentials for evaluators & admins */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Authorized 1-Click Access:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activePortal === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@campusfix.edu', 'password123')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 font-medium transition-colors"
                  >
                    Campus Admin (admin@campusfix.edu)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('aryan2008dbg@gmail.com', 'password123')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-medium transition-colors"
                  >
                    App Owner (aryan2008dbg@gmail.com)
                  </button>
                </>
              )}

              {activePortal === 'staff' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('rajesh.electric@campusfix.edu', 'password123')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 font-medium transition-colors"
                  >
                    Electrical (Rajesh)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('suresh.plumb@campusfix.edu', 'password123')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 font-medium transition-colors"
                  >
                    Plumbing (Suresh)
                  </button>
                </>
              )}

              {activePortal === 'student' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('student@campusfix.edu', 'password123')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 font-medium transition-colors"
                  >
                    Demo Student (student@campusfix.edu)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('aarav.22cs101@campusfix.edu', 'password123')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 font-medium transition-colors"
                  >
                    Aarav (22CS101)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Student Registration Link & Security Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2.5 text-center">
            <p className="text-xs text-slate-500">
              New campus student?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
                Register student profile
              </Link>
            </p>

            <button
              type="button"
              onClick={() => setShowCredentialsGuide(!showCredentialsGuide)}
              className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              {showCredentialsGuide ? 'Hide authorized account reference' : 'View all authorized campus accounts'}
            </button>

            {showCredentialsGuide && (
              <div className="w-full mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left text-[11px] space-y-2 text-slate-600 animate-in fade-in duration-200">
                <p className="font-bold text-slate-800 text-xs">All Authorized Campus Accounts:</p>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-purple-700 uppercase">App Owner Admin:</span> aryan2008dbg@gmail.com / password123
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-purple-700 uppercase">Campus Admin:</span> admin@campusfix.edu / password123
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-blue-700 uppercase">Staff (Electric):</span> rajesh.electric@campusfix.edu / password123
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-blue-700 uppercase">Staff (Plumbing):</span> suresh.plumb@campusfix.edu / password123
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-emerald-700 uppercase">Student:</span> student@campusfix.edu / password123
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Note: Role-based authorization is strictly enforced by Firestore Security Rules. Public registration is restricted to student accounts only.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Account Password</h3>
                <p className="text-[11px] text-slate-500">Enter your registered campus email</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password reset requested! Check your email or notifications for temporary credentials.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                {forgotError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200 font-medium">
                    {forgotError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campus Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. admin@campusfix.edu or student@campusfix.edu"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotError('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
