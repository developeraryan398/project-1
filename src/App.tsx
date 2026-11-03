import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { Bell, X, ShieldAlert, ArrowRight } from 'lucide-react';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { AboutPage } from './pages/public/AboutPage';
import { AccessDeniedPage } from './pages/public/AccessDeniedPage';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CreateComplaint } from './pages/student/CreateComplaint';
import { MyComplaints } from './pages/student/MyComplaints';
import { ComplaintDetail } from './pages/student/ComplaintDetail';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentNotifications } from './pages/student/StudentNotifications';

// Staff pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AssignedComplaints } from './pages/staff/AssignedComplaints';
import { StaffComplaintDetail } from './pages/staff/StaffComplaintDetail';
import { StaffWorkHistory } from './pages/staff/StaffWorkHistory';
import { StaffProfile } from './pages/staff/StaffProfile';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllComplaints } from './pages/admin/AllComplaints';
import { ManageDepartments } from './pages/admin/ManageDepartments';
import { ManageUsers } from './pages/admin/ManageUsers';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';

// Toast Alert
const LiveNotificationToast: React.FC = () => {
  const { latestToast, clearToast } = useNotifications();

  if (!latestToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
      <div className="p-2 bg-indigo-600 rounded-xl shrink-0 mt-0.5">
        <Bell className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white line-clamp-1">{latestToast.title}</p>
        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{latestToast.message}</p>
      </div>
      <button
        onClick={clearToast}
        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Main Layout
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Public pages that don't need persistent sidebar
  const isPublicStandalone = ['/', '/login', '/register', '/about', '/access-denied'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex w-full">
        {!isPublicStandalone && (
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      <Footer />
      <LiveNotificationToast />
    </div>
  );
};

// Role Protected Route Guard
const RoleProtectedRoute: React.FC<{
  allowedRoles: ('student' | 'staff' | 'admin')[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <RoleProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/create"
                element={
                  <RoleProtectedRoute allowedRoles={['student', 'admin']}>
                    <CreateComplaint />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/complaints"
                element={
                  <RoleProtectedRoute allowedRoles={['student', 'admin']}>
                    <MyComplaints />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/complaints/:id"
                element={
                  <RoleProtectedRoute allowedRoles={['student', 'admin']}>
                    <ComplaintDetail />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/notifications"
                element={
                  <RoleProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentNotifications />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <RoleProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentProfile />
                  </RoleProtectedRoute>
                }
              />

              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <RoleProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/staff/assigned"
                element={
                  <RoleProtectedRoute allowedRoles={['staff', 'admin']}>
                    <AssignedComplaints />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/staff/complaints/:id"
                element={
                  <RoleProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffComplaintDetail />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/staff/history"
                element={
                  <RoleProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffWorkHistory />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/staff/profile"
                element={
                  <RoleProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffProfile />
                  </RoleProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AllComplaints />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <ManageDepartments />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <ManageUsers />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalytics />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdminReports />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </RoleProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
