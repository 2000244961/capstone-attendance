// Trigger Vercel redeploy

import React from 'react';
import { UserProvider } from './shared/UserContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Initialize notification data
import './shared/initializeNotificationData';

// Import your components from the new feature-based structure
import Login from './pages/Login';
import DashboardTeacher from './pages/DashboardTeacher';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardParent from './features/parent/pages/DashboardParent';
import FaceRecognition from './features/attendance/pages/FaceRecognition';
import ManageStudent from './features/students/pages/ManageStudent';
import ManageAttendance from './features/attendance/pages/ManageAttendance';
import ManageSubjectSection from './features/students/pages/ManageSubjectSection';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

// Vercel redeploy trigger
function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <DashboardTeacher />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parent-dashboard" 
            element={
              <ProtectedRoute requiredRole="parent">
                <DashboardParent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/facial-recognition" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <FaceRecognition />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-student" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <ManageStudent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-attendance" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <ManageAttendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-subject-section" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <ManageSubjectSection />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
