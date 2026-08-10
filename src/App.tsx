import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const StudentsPage = lazy(() => import('@/pages/admin/StudentsPage'));
const RegistrationsPage = lazy(() => import('@/pages/admin/RegistrationsPage'));
const HadithsPage = lazy(() => import('@/pages/admin/HadithsPage'));
const ProgramPage = lazy(() => import('@/pages/admin/ProgramPage'));
const AdminCertificatesPage = lazy(() => import('@/pages/admin/CertificatesPage'));
const MessagesPage = lazy(() => import('@/pages/admin/MessagesPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const SupervisorsPage = lazy(() => import('@/pages/admin/SupervisorsPage'));
const AdminsPage = lazy(() => import('@/pages/admin/AdminsPage'));
const LogsPage = lazy(() => import('@/pages/admin/LogsPage'));
const BackupPage = lazy(() => import('@/pages/admin/BackupPage'));
const FilesPage = lazy(() => import('@/pages/admin/FilesPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const MemorizePage = lazy(() => import('@/pages/student/MemorizePage'));
const ListenPage = lazy(() => import('@/pages/student/ListenPage'));
const ReadPage = lazy(() => import('@/pages/student/ReadPage'));
const DailyLessonPage = lazy(() => import('@/pages/student/DailyLessonPage'));
const StudentProgressPage = lazy(() => import('@/pages/student/ProgressPage'));
const StudentCertificatesPage = lazy(() => import('@/pages/student/CertificatesPage'));
const StudentMessagesPage = lazy(() => import('@/pages/student/MessagesPage'));
const StudentNotificationsPage = lazy(() => import('@/pages/student/NotificationsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<FullPageSpinner message="جاري التحميل..." />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin + Supervisor routes */}
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/registrations"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <RegistrationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hadiths"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <HadithsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/program"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <ProgramPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <AdminCertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute roles={['admin', 'supervisor']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/admin/supervisors"
              element={
                <ProtectedRoute roles={['admin']}>
                  <SupervisorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admins"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/backup"
              element={
                <ProtectedRoute roles={['admin']}>
                  <BackupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/files"
              element={
                <ProtectedRoute roles={['admin']}>
                  <FilesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Student routes */}
            <Route
              path="/student/memorize"
              element={
                <ProtectedRoute roles={['student']}>
                  <MemorizePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/listen"
              element={
                <ProtectedRoute roles={['student']}>
                  <ListenPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/read"
              element={
                <ProtectedRoute roles={['student']}>
                  <ReadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/daily"
              element={
                <ProtectedRoute roles={['student']}>
                  <DailyLessonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/progress"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentCertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/messages"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentMessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentNotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Shared */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
