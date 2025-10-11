import React, { useState, useEffect } from 'react';
import '../styles/DashboardTeacher.css';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../shared/useDashboard';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import NotificationIcon from '../../../shared/components/NotificationIcon';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';

function DashboardTeacher() {
  const navigate = useNavigate();
  const { data: dashboardData, loading, error, refresh } = useDashboardData(30000);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Notification system
  const notifications = useNotifications('teacher');

  // Navigation handlers
  const handleManageStudentClick = () => {
    navigate('/manage-student');
  };

  const handleManageAttendanceClick = () => {
    navigate('/manage-attendance');
  };

  const handleManageSubjectSectionClick = () => {
    navigate('/manage-subject-section');
  };

  const handleGoToFaceRecognition = () => {
    navigate('/facial-recognition');
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    const logEntry = {
      id: Date.now().toString(),
      action: 'Teacher logout',
      timestamp: new Date().toISOString(),
      admin: 'Teacher',
      type: 'logout'
    };
    const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];
    logs.unshift(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
    navigate('/');
  };

  return (
    <div className="teacher-dashboard-container">
      {/* Sidebar */}
      <aside className="teacher-sidebar">
        <h2 className="teacher-logo">SPCC Teacher Portal</h2>
        <nav className="teacher-nav">
          <ul>
            <li 
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={() => setActiveSection('overview')}
            >
              📊 Dashboard Overview
            </li>
            <li onClick={handleManageStudentClick}>
              👥 Manage Students
            </li>
            <li onClick={handleManageAttendanceClick}>
              📝 Manage Attendance
            </li>
            <li onClick={handleManageSubjectSectionClick}>
              📚 Manage Subjects/Sections
            </li>
            <li onClick={handleGoToFaceRecognition}>
              📷 Facial Recognition
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="teacher-main-content">
        <header className="teacher-header">
          <h1>Teacher Dashboard</h1>
          <div className="teacher-top-bar">
            <input type="text" placeholder="Search..." className="search-input" />
            <div className="teacher-user-info">
              <NotificationIcon 
                unreadCount={notifications.unreadCount}
                onClick={notifications.toggleNotifications}
                color="#2196F3"
              />
              <span className="icon">👤</span>
              <span className="username">Teacher</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Notification Dropdown */}
        <NotificationDropdown
          notifications={notifications.notifications}
          isOpen={notifications.isOpen}
          onClose={notifications.closeNotifications}
          onMarkAsRead={notifications.markAsRead}
          onMarkAllAsRead={notifications.markAllAsRead}
          onDelete={notifications.deleteNotification}
        />

        {/* Content based on active section */}
        <div className="teacher-content">
          {activeSection === 'overview' && (
            <TeacherOverview 
              dashboardData={dashboardData}
              onManageStudent={handleManageStudentClick}
              onManageAttendance={handleManageAttendanceClick}
              onManageSubjects={handleManageSubjectSectionClick}
              onFaceRecognition={handleGoToFaceRecognition}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Teacher Overview Component
const TeacherOverview = ({ dashboardData, onManageStudent, onManageAttendance, onManageSubjects, onFaceRecognition }) => {
  return (
    <div className="overview-section">
      <h2>📊 Teaching Overview</h2>
      
      {/* Stats Grid */}
      <div className="teacher-stats-grid">
        <div className="teacher-stat-card">
          <h3>Classes Today</h3>
          <p className="stat-number">{dashboardData.todaysClasses}</p>
          <span>{dashboardData.todaysClasses} classes taught</span>
        </div>
        
        <div className="teacher-stat-card">
          <h3>Students Present</h3>
          <p className="stat-number">{dashboardData.studentsPresent}</p>
          <span>{dashboardData.attendancePercentage}% attendance</span>
        </div>
        
        <div className="teacher-stat-card">
          <h3>Total Subjects</h3>
          <p className="stat-number">{dashboardData.totalSubjects}</p>
          <span>Subjects managed</span>
        </div>
        
        <div className="teacher-stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{dashboardData.totalStudents}</p>
          <span>Students registered</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={onFaceRecognition}>
            📷 Start Facial Recognition
          </button>
          <button className="action-btn secondary" onClick={onManageAttendance}>
            📝 Record Attendance
          </button>
          <button className="action-btn tertiary" onClick={onManageStudent}>
            👥 Manage Students
          </button>
          <button className="action-btn quaternary" onClick={onManageSubjects}>
            📚 Manage Subjects
          </button>
        </div>
      </div>

      {/* Today's Analytics */}
      <div className="analytics-section">
        <h3>📈 Today's Analytics</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>📚 Subject Coverage</h4>
            <p>
              {dashboardData.totalSubjects > 0 
                ? `Managing ${dashboardData.totalSubjects} subject${dashboardData.totalSubjects !== 1 ? 's' : ''}`
                : 'No subjects configured yet'
              }
            </p>
          </div>
          
          <div className="analytics-card">
            <h4>👥 Student Engagement</h4>
            <p>
              {dashboardData.totalStudents > 0 
                ? `${dashboardData.studentsPresent} out of ${dashboardData.totalStudents} students attended today`
                : 'No students registered yet'
              }
            </p>
          </div>
          
          <div className="analytics-card">
            <h4>🎯 Class Status</h4>
            <p>
              {dashboardData.todaysClasses > 0 
                ? `${dashboardData.todaysClasses} class${dashboardData.todaysClasses !== 1 ? 'es' : ''} conducted today`
                : 'No classes conducted today'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>📋 Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <h4>Attendance Recorded</h4>
              <p>Mathematics class - Section A</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">👥</div>
            <div className="activity-content">
              <h4>New Student Added</h4>
              <p>John Doe enrolled in Section B</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">📚</div>
            <div className="activity-content">
              <h4>Subject Updated</h4>
              <p>Science curriculum updated</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTeacher;
