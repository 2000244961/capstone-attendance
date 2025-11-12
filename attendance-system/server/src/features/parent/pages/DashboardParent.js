import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../shared/useDashboard';
import { useParentDashboard } from '../hooks/useParent';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import NotificationIcon from '../../../shared/components/NotificationIcon';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import '../initializeParentData'; // Initialize sample data
import '../styles/DashboardParent.css';

function DashboardParent() {
  const navigate = useNavigate();
  const { data: dashboardData, loading, error } = useDashboardData(30000);
  const parentData = useParentDashboard();
  
  // Notification system
  const notifications = useNotifications('parent');
  
  // State management
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  // Get current user and child info
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const parentInfo = JSON.parse(localStorage.getItem('parents') || '[]')
      .find(parent => parent.email === currentUser.username);
    
    if (parentInfo && parentInfo.children && parentInfo.children.length > 0) {
      setSelectedChild(parentInfo.children[0]);
    }
  }, []);

  // Generate calendar data
  const generateCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const calendar = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const attendanceRecord = parentData.getAttendanceForDate(selectedChild?.studentId, date);
      calendar.push({
        day,
        date,
        attendance: attendanceRecord
      });
    }
    
    return calendar;
  };

  // Handle contact teacher
  const handleContactTeacher = () => {
    if (!contactMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      from: 'Parent',
      to: 'Teacher',
      subject: `Regarding ${selectedChild?.name}`,
      message: contactMessage,
      timestamp: new Date().toISOString(),
      studentId: selectedChild?.studentId,
      status: 'sent'
    };
    
    // Store message
    const messages = JSON.parse(localStorage.getItem('parentTeacherMessages') || '[]');
    messages.unshift(message);
    localStorage.setItem('parentTeacherMessages', JSON.stringify(messages));
    
    // Log action
    const logEntry = {
      id: Date.now().toString(),
      action: `Parent contacted teacher about ${selectedChild?.name}`,
      timestamp: new Date().toISOString(),
      admin: 'Parent',
      type: 'communication'
    };
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
    
    setContactMessage('');
    setShowContactModal(false);
    alert('Message sent to teacher successfully!');
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    const logEntry = {
      id: Date.now().toString(),
      action: 'Parent logout',
      timestamp: new Date().toISOString(),
      admin: 'Parent',
      type: 'logout'
    };
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
    navigate('/');
  };

  return (
    <div className="parent-dashboard-container">
      {/* Sidebar */}
      <aside className="parent-sidebar">
        <h2 className="parent-logo">SPCC Parent Portal</h2>
        <nav className="parent-nav">
          <ul>
            <li 
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={() => setActiveSection('overview')}
            >
              📊 Overview
            </li>
            <li 
              className={activeSection === 'calendar' ? 'active' : ''}
              onClick={() => setActiveSection('calendar')}
            >
              📅 Attendance Calendar
            </li>
            <li 
              className={activeSection === 'statistics' ? 'active' : ''}
              onClick={() => setActiveSection('statistics')}
            >
              📈 Statistics
            </li>
            <li 
              className={activeSection === 'alerts' ? 'active' : ''}
              onClick={() => setActiveSection('alerts')}
            >
              🔔 Alerts & Notifications
            </li>
            <li 
              className={activeSection === 'subjects' ? 'active' : ''}
              onClick={() => setActiveSection('subjects')}
            >
              📚 Subjects & Sections
            </li>
            <li 
              className={activeSection === 'feedback' ? 'active' : ''}
              onClick={() => setActiveSection('feedback')}
            >
              💬 Teacher Feedback
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="parent-main-content">
        <header className="parent-header">
          <h1>Parent Dashboard</h1>
          <div className="parent-top-bar">
            <div className="child-selector">
              <label>Child:</label>
              <select 
                value={selectedChild?.studentId || ''} 
                onChange={(e) => {
                  const child = parentData.children.find(c => c.studentId === e.target.value);
                  setSelectedChild(child);
                }}
              >
                {parentData.children.map(child => (
                  <option key={child.studentId} value={child.studentId}>
                    {child.name} - {child.studentId}
                  </option>
                ))}
              </select>
            </div>
            <div className="parent-user-info">
              <NotificationIcon 
                unreadCount={notifications.unreadCount}
                onClick={notifications.toggleNotifications}
                color="#9C27B0"
              />
              <span className="icon">👤</span>
              <span className="username">Parent</span>
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
        <div className="parent-content">
          {activeSection === 'overview' && (
            <StudentAttendanceOverview 
              selectedChild={selectedChild}
              parentData={parentData}
              onContactTeacher={() => setShowContactModal(true)}
            />
          )}
          
          {activeSection === 'calendar' && (
            <AttendanceCalendar 
              selectedChild={selectedChild}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              calendar={generateCalendar()}
            />
          )}
          
          {activeSection === 'statistics' && (
            <AttendanceStatistics 
              selectedChild={selectedChild}
              parentData={parentData}
            />
          )}
          
          {activeSection === 'alerts' && (
            <AlertsNotifications 
              selectedChild={selectedChild}
              parentData={parentData}
            />
          )}
          
          {activeSection === 'subjects' && (
            <SubjectSectionInfo 
              selectedChild={selectedChild}
              parentData={parentData}
            />
          )}
          
          {activeSection === 'feedback' && (
            <TeacherFeedback 
              selectedChild={selectedChild}
              parentData={parentData}
              onContactTeacher={() => setShowContactModal(true)}
            />
          )}
        </div>

        {/* Contact Teacher Modal */}
        {showContactModal && (
          <div className="contact-modal-overlay">
            <div className="contact-modal">
              <h3>Contact Teacher</h3>
              <p>Send a message to {selectedChild?.name}'s teacher</p>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message here..."
                rows="4"
              />
              <div className="modal-actions">
                <button onClick={() => setShowContactModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleContactTeacher} className="send-btn">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Student Attendance Overview Component
const StudentAttendanceOverview = ({ selectedChild, parentData, onContactTeacher }) => {
  if (!selectedChild) {
    return (
      <div className="overview-section">
        <h2>👨‍👩‍👧‍👦 Student Overview</h2>
        <p>Please select a child to view their attendance information.</p>
      </div>
    );
  }

  const todayAttendance = parentData.getTodayAttendance(selectedChild.studentId);
  const weeklyStats = parentData.getWeeklyStats(selectedChild.studentId);
  const monthlyStats = parentData.getMonthlyStats(selectedChild.studentId);

  return (
    <div className="overview-section">
      <h2>👨‍👩‍👧‍👦 {selectedChild.name}'s Overview</h2>
      
      <div className="parent-stats-grid">
        <div className="parent-stat-card">
          <h3>Today's Status</h3>
          <p className={`status ${todayAttendance ? 'present' : 'absent'}`}>
            {todayAttendance ? '✅ Present' : '❌ Absent'}
          </p>
          <span>{todayAttendance ? 'Attended classes today' : 'No attendance recorded'}</span>
        </div>
        
        <div className="parent-stat-card">
          <h3>This Week</h3>
          <p className="stat-number">{weeklyStats.present}/{weeklyStats.total}</p>
          <span>{weeklyStats.percentage}% attendance rate</span>
        </div>
        
        <div className="parent-stat-card">
          <h3>This Month</h3>
          <p className="stat-number">{monthlyStats.present}/{monthlyStats.total}</p>
          <span>{monthlyStats.percentage}% attendance rate</span>
        </div>
        
        <div className="parent-stat-card">
          <h3>Overall Grade</h3>
          <p className={`grade ${monthlyStats.grade.toLowerCase()}`}>
            {monthlyStats.grade}
          </p>
          <span>Based on attendance</span>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={onContactTeacher}>
            📧 Contact Teacher
          </button>
          <button className="action-btn secondary">📊 View Full Report</button>
          <button className="action-btn tertiary">📅 View Calendar</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>📋 Recent Activity</h3>
        <div className="activity-list">
          {parentData.getRecentActivity(selectedChild.studentId).map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'attendance' ? '📝' : 
                 activity.type === 'absence' ? '❌' : '📚'}
              </div>
              <div className="activity-content">
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Attendance Calendar Component
const AttendanceCalendar = ({ selectedChild, selectedMonth, selectedYear, onMonthChange, onYearChange, calendar }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-section">
      <h2>📅 Attendance Calendar</h2>
      
      <div className="calendar-controls">
        <select value={selectedMonth} onChange={(e) => onMonthChange(parseInt(e.target.value))}>
          {monthNames.map((month, index) => (
            <option key={index} value={index}>{month}</option>
          ))}
        </select>
        <select value={selectedYear} onChange={(e) => onYearChange(parseInt(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color present"></div>
          <span>Present</span>
        </div>
        <div className="legend-item">
          <div className="legend-color absent"></div>
          <span>Absent</span>
        </div>
        <div className="legend-item">
          <div className="legend-color partial"></div>
          <span>Partial</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-class"></div>
          <span>No Class</span>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-header">
          {dayNames.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        
        <div className="calendar-body">
          {calendar.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${day ? day.attendance?.status || 'no-class' : 'empty'}`}
            >
              {day && (
                <>
                  <span className="day-number">{day.day}</span>
                  {day.attendance && (
                    <div className="attendance-indicator">
                      {day.attendance.status === 'present' ? '✅' :
                       day.attendance.status === 'absent' ? '❌' :
                       day.attendance.status === 'partial' ? '⚠️' : ''}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Attendance Statistics Component
const AttendanceStatistics = ({ selectedChild, parentData }) => {
  if (!selectedChild) return <div>Please select a child to view statistics.</div>;

  const yearlyStats = parentData.getYearlyStats(selectedChild.studentId);
  const subjectStats = parentData.getSubjectStats(selectedChild.studentId);

  return (
    <div className="statistics-section">
      <h2>📈 Attendance Statistics</h2>
      
      <div className="stats-overview">
        <div className="stat-card large">
          <h3>Yearly Overview</h3>
          <div className="progress-ring">
            <div className="progress-value">{yearlyStats.percentage}%</div>
          </div>
          <p>{yearlyStats.present} days present out of {yearlyStats.total} total days</p>
        </div>
        
        <div className="trend-chart">
          <h3>Monthly Trends</h3>
          <div className="chart-placeholder">
            {/* Chart implementation would go here */}
            <p>Monthly attendance visualization</p>
          </div>
        </div>
      </div>

      <div className="subject-stats">
        <h3>📚 Subject-wise Attendance</h3>
        <div className="subject-list">
          {subjectStats.map((subject, index) => (
            <div key={index} className="subject-item">
              <div className="subject-info">
                <h4>{subject.name}</h4>
                <p>Section: {subject.section}</p>
              </div>
              <div className="subject-attendance">
                <div className="attendance-bar">
                  <div 
                    className="attendance-fill" 
                    style={{ width: `${subject.percentage}%` }}
                  ></div>
                </div>
                <span>{subject.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Alerts and Notifications Component
const AlertsNotifications = ({ selectedChild, parentData }) => {
  const alerts = parentData.getAlerts(selectedChild?.studentId);

  return (
    <div className="alerts-section">
      <h2>🔔 Alerts & Notifications</h2>
      
      <div className="alerts-list">
        {alerts.length > 0 ? alerts.map((alert, index) => (
          <div key={index} className={`alert-item ${alert.type}`}>
            <div className="alert-icon">
              {alert.type === 'absence' ? '❌' :
               alert.type === 'low-attendance' ? '⚠️' :
               alert.type === 'achievement' ? '🏆' : '📢'}
            </div>
            <div className="alert-content">
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
              <span className="alert-time">{alert.timestamp}</span>
            </div>
            <div className="alert-actions">
              <button className="acknowledge-btn">✓</button>
            </div>
          </div>
        )) : (
          <div className="no-alerts">
            <p>No new alerts or notifications</p>
          </div>
        )}
      </div>
      
      <div className="notification-settings">
        <h3>🔧 Notification Settings</h3>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            Email notifications for absences
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            SMS alerts for low attendance
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            Weekly attendance reports
          </label>
        </div>
      </div>
    </div>
  );
};

// Subject Section Info Component
const SubjectSectionInfo = ({ selectedChild, parentData }) => {
  const subjects = parentData.getSubjects(selectedChild?.studentId);

  return (
    <div className="subjects-section">
      <h2>📚 Subjects & Sections</h2>
      
      <div className="subjects-grid">
        {subjects.map((subject, index) => (
          <div key={index} className="subject-card">
            <div className="subject-header">
              <h3>{subject.name}</h3>
              <span className="section-badge">Section {subject.section}</span>
            </div>
            <div className="subject-details">
              <p><strong>Teacher:</strong> {subject.teacher}</p>
              <p><strong>Schedule:</strong> {subject.schedule}</p>
              <p><strong>Room:</strong> {subject.room}</p>
              <p><strong>Attendance:</strong> {subject.attendance}%</p>
            </div>
            <div className="subject-actions">
              <button className="action-btn small">📧 Contact Teacher</button>
              <button className="action-btn small">📊 View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Teacher Feedback Component
const TeacherFeedback = ({ selectedChild, parentData, onContactTeacher }) => {
  const feedback = parentData.getTeacherFeedback(selectedChild?.studentId);
  const messages = parentData.getMessages(selectedChild?.studentId);

  return (
    <div className="feedback-section">
      <h2>💬 Teacher Feedback & Notes</h2>
      
      <div className="feedback-overview">
        <button className="contact-teacher-btn" onClick={onContactTeacher}>
          📧 Contact Teacher
        </button>
      </div>

      <div className="feedback-content">
        <div className="feedback-notes">
          <h3>📝 Recent Feedback</h3>
          {feedback.length > 0 ? feedback.map((note, index) => (
            <div key={index} className="feedback-item">
              <div className="feedback-header">
                <h4>{note.subject}</h4>
                <span className="feedback-date">{note.date}</span>
              </div>
              <p>{note.content}</p>
              <div className="feedback-footer">
                <span className="teacher-name">- {note.teacher}</span>
                <span className={`feedback-type ${note.type}`}>{note.type}</span>
              </div>
            </div>
          )) : (
            <p>No recent feedback available</p>
          )}
        </div>

        <div className="message-history">
          <h3>💬 Message History</h3>
          {messages.length > 0 ? messages.map((message, index) => (
            <div key={index} className={`message-item ${message.from.toLowerCase()}`}>
              <div className="message-header">
                <strong>{message.from}</strong>
                <span>{message.timestamp}</span>
              </div>
              <p>{message.content}</p>
            </div>
          )) : (
            <p>No message history</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardParent;
