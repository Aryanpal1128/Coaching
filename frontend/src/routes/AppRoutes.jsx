import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

import { Suspense, lazy } from 'react';

const Login = lazy(() => import('../pages/auth/Login.jsx').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/auth/Register.jsx').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword.jsx').then(m => ({ default: m.ResetPassword })));

const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard.jsx').then(m => ({ default: m.StudentDashboard })));
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard.jsx').then(m => ({ default: m.TeacherDashboard })));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx').then(m => ({ default: m.AdminDashboard })));

const QuestionFeed = lazy(() => import('../pages/questions/QuestionFeed.jsx').then(m => ({ default: m.QuestionFeed })));
const QuestionDetails = lazy(() => import('../pages/questions/QuestionDetails.jsx').then(m => ({ default: m.QuestionDetails })));
const AskQuestion = lazy(() => import('../pages/questions/AskQuestion.jsx').then(m => ({ default: m.AskQuestion })));

const Leaderboard = lazy(() => import('../pages/leaderboard/Leaderboard.jsx').then(m => ({ default: m.Leaderboard })));
const UserProfile = lazy(() => import('../pages/profile/UserProfile.jsx').then(m => ({ default: m.UserProfile })));
const LiveClasses = lazy(() => import('../pages/liveClasses/LiveClasses.jsx').then(m => ({ default: m.LiveClasses })));
const StudyMaterials = lazy(() => import('../pages/studyMaterials/StudyMaterials.jsx').then(m => ({ default: m.StudyMaterials })));
const Messages = lazy(() => import('../pages/messaging/Messages.jsx').then(m => ({ default: m.Messages })));

export const AppRoutes = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950 flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl animate-pulse">
          AI
        </div>
        <p className="text-xs text-slate-400 animate-pulse">Loading Coaching.ai...</p>
      </div>
    }>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<StudentDashboard />} />

            <Route element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']} />}>
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>

            <Route path="/questions" element={<QuestionFeed />} />
            <Route path="/questions/:id" element={<QuestionDetails />} />
            <Route path="/ask-question" element={<AskQuestion />} />

            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/live-classes" element={<LiveClasses />} />
            <Route path="/study-materials" element={<StudyMaterials />} />
            <Route path="/messages" element={<Messages />} />
          </Route>
        </Route>

        {/* Default Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
