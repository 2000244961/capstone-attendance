import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../shared/useDashboard';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import NotificationIcon from '../../../shared/components/NotificationIcon';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import '../styles/DashboardAdmin.css';


function DashboardAdmin() {
  const navigate = useNavigate();
  const { data: dashboardData } = useDashboardData(30000);
  const [activeSection, setActiveSection] = useState('overview');
  // Notification system
  const notifications = useNotifications('admin');

  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetAudience: 'all'
  });

  // User Management state (teachers only)
  const [users, setUsers] = useState(() => {
    // Load from localStorage or initialize with sample data
    const data = JSON.parse(localStorage.getItem('users'));
    if (data && data.teachers) return { teachers: data.teachers };
    const sample = {
      teachers: [
        { id: 'T001', name: 'John Smith', email: 'john.smith@spcc.edu', subject: 'Mathematics', status: 'active' },
        { id: 'T002', name: 'Maria Garcia', email: 'maria.garcia@spcc.edu', subject: 'Science', status: 'active' },
        { id: 'T003', name: 'Robert Wilson', email: 'robert.wilson@spcc.edu', subject: 'English', status: 'inactive' },
      ]
    };
    localStorage.setItem('users', JSON.stringify(sample));
    return sample;
  });
  // Add/Edit User Modal State
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormType, setUserFormType] = useState('add'); // 'add' or 'edit'
  const [userFormData, setUserFormData] = useState({});
  const [editUserId, setEditUserId] = useState(null);

  // Add/Edit/Delete User Handlers
  const handleAddUser = () => {
    setUserFormType('add');
    setUserFormData({});
    setEditUserId(null);
    setShowUserForm(true);
  };
  const handleEditUser = (user) => {
    setUserFormType('edit');
    setUserFormData(user);
    setEditUserId(user.id);
    setShowUserForm(true);
  };
  const handleDeleteUser = (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const updated = { ...users };
    updated.teachers = users.teachers.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
  };
  const handleUserFormChange = (e) => {
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
  };
  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    let updated = { ...users };
    if (userFormType === 'add') {
      // Generate new ID
      let nextId = 'T' + String(Math.floor(Math.random() * 9000) + 1000);
      updated.teachers = [
        { id: nextId, ...userFormData, status: 'active' },
        ...users.teachers
      ];
    } else if (userFormType === 'edit') {
      updated.teachers = users.teachers.map(u =>
        u.id === editUserId ? { ...u, ...userFormData } : u
      );
    }
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
    setShowUserForm(false);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    const logEntry = {
      id: Date.now().toString(),
      action: 'Admin logout',
      timestamp: new Date().toISOString(),
      admin: 'Administrator',
      type: 'logout'
    };
    const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];
    logs.unshift(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
    navigate('/');
  };

  // Function to create custom announcement
  const createAnnouncement = () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      alert('Please fill in both title and content!');
      return;
    }

    const announcement = {
      id: `ann-${Date.now()}`,
      title: announcementForm.title,
      content: announcementForm.content,
      priority: announcementForm.priority,
      targetAudience: announcementForm.targetAudience,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      readBy: []
    };

    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    announcements.unshift(announcement);
    localStorage.setItem('announcements', JSON.stringify(announcements));

    // Add notification for admin
    notifications.addNotification({
      title: 'Announcement Created',
      message: `"${announcement.title}" has been published to ${announcement.targetAudience}`,
      priority: announcement.priority
    });

    // Reset form and close
    setAnnouncementForm({
      title: '',
      content: '',
      priority: 'medium',
      targetAudience: 'all'
    });
    setShowAnnouncementForm(false);

    alert(`Announcement "${announcement.title}" has been sent to ${announcement.targetAudience}!`);
  };

  // Sample function to create test announcement (keeping for backward compatibility)
  const createSampleAnnouncement = () => {
    setShowAnnouncementForm(true);
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">SPCC Admin Portal</h2>
        <nav className="admin-nav">
          <ul>
            <li 
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={() => setActiveSection('overview')}
            >
              📊 Dashboard Overview
            </li>
            <li 
              className={activeSection === 'users' ? 'active' : ''}
              onClick={() => setActiveSection('users')}
            >
              👥 User Management
            </li>
            <li 
              className={activeSection === 'announcements' ? 'active' : ''}
              onClick={() => setActiveSection('announcements')}
            >
              📢 Announcements
            </li>
            <li 
              className={activeSection === 'reports' ? 'active' : ''}
              onClick={() => setActiveSection('reports')}
            >
              📊 Reports
            </li>
            <li 
              className={activeSection === 'settings' ? 'active' : ''}
              onClick={() => setActiveSection('settings')}
            >
              ⚙️ System Settings
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-top-bar">
            <input type="text" placeholder="Search admin functions..." />
            <div className="admin-user-info">
              <NotificationIcon 
                unreadCount={notifications.unreadCount}
                onClick={notifications.toggleNotifications}
                color="#2196F3"
              />
              <span className="icon">👤</span>
              <span className="username">Administrator</span>
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

        {/* Content */}
        <div className="admin-content">
          {activeSection === 'overview' && (
            <div className="overview-section">
              <h2>📊 System Overview</h2>
              
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Total Students</h3>
                  <p className="stat-number">{dashboardData.totalStudents || 0}</p>
                  <span>Registered students</span>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Today's Attendance</h3>
                  <p className="stat-number">{dashboardData.attendancePercentage || 0}%</p>
                  <span>Overall attendance</span>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Total Subjects</h3>
                  <p className="stat-number">{dashboardData.totalSubjects || 0}</p>
                  <span>Active subjects</span>
                </div>
                
                <div className="admin-stat-card">
                  <h3>System Health</h3>
                  <p className="stat-number">98%</p>
                  <span>System uptime</span>
                </div>
              </div>

              <div className="quick-actions">
                <h3>⚡ Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn primary"
                    onClick={createSampleAnnouncement}
                  >
                    📢 Create Announcement
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => setActiveSection('users')}
                  >
                    👥 Manage Users
                  </button>
                  <button 
                    className="action-btn tertiary"
                    onClick={() => setActiveSection('reports')}
                  >
                    📊 View Reports
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'announcements' && (
            <div className="announcements-section">
              <h2>📢 Announcements</h2>
              <div className="section-header">
                <button 
                  className="create-btn action-btn primary"
                  onClick={() => setShowAnnouncementForm(true)}
                >
                  ➕ Create New Announcement
                </button>
              </div>

              {/* Announcement Form */}
              {showAnnouncementForm && (
                <div className="announcement-form-overlay">
                  <div className="announcement-form">
                    <h3>Create New Announcement</h3>
                    
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                        placeholder="Enter announcement title..."
                        maxLength="100"
                      />
                    </div>

                    <div className="form-group">
                      <label>Content *</label>
                      <textarea
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                        placeholder="Type your announcement message here..."
                        rows="4"
                        maxLength="500"
                      ></textarea>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Priority</label>
                        <select
                          value={announcementForm.priority}
                          onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Send To</label>
                        <select
                          value={announcementForm.targetAudience}
                          onChange={(e) => setAnnouncementForm({...announcementForm, targetAudience: e.target.value})}
                        >
                          <option value="all">All (Teachers & Parents)</option>
                          <option value="teachers">Teachers Only</option>
                          <option value="parents">Parents Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        className="action-btn secondary"
                        onClick={() => setShowAnnouncementForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="action-btn primary"
                        onClick={createAnnouncement}
                      >
                        📤 Send Announcement
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="announcement-info">
                <h3>📋 How it works:</h3>
                <ul>
                  <li>✍️ Type your custom announcement title and message</li>
                  <li>🎯 Choose who should receive it (Teachers, Parents, or Both)</li>
                  <li>⚡ Set priority level (Low, Medium, High, or Urgent)</li>
                  <li>📤 Send it instantly to their notification panels</li>
                  <li>🔔 Recipients will see it in their notification icon</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="users-section">
              <h2>👥 User Management</h2>
              <div className="user-management-tabs">
                <button className="tab-btn active">Teachers</button>
              </div>
              <div className="user-actions">
                <button className="action-btn primary" onClick={handleAddUser}>➕ Add New Teacher</button>
                <button className="action-btn secondary">📊 Generate Reports</button>
                <button className="action-btn tertiary">📤 Export Data</button>
              </div>
              {/* User Add/Edit Modal */}
              {showUserForm && (
                <div className="announcement-form-overlay">
                  <div className="announcement-form">
                    <h3>{userFormType === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</h3>
                    <form onSubmit={handleUserFormSubmit}>
                      <div className="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" value={userFormData.name || ''} onChange={handleUserFormChange} required maxLength="50" />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" value={userFormData.email || ''} onChange={handleUserFormChange} required maxLength="50" />
                      </div>
                      <div className="form-group">
                        <label>Subject *</label>
                        <input type="text" name="subject" value={userFormData.subject || ''} onChange={handleUserFormChange} required maxLength="30" />
                      </div>
                      <div className="form-actions">
                        <button type="button" className="action-btn secondary" onClick={() => setShowUserForm(false)}>Cancel</button>
                        <button type="submit" className="action-btn primary">{userFormType === 'add' ? 'Add' : 'Save'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.teachers.length === 0 ? (
                      <tr><td colSpan="6">No teachers found.</td></tr>
                    ) : (
                      users.teachers.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.subject}</td>
                          <td><span className={`status ${user.status}`}>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
                          <td>
                            <button className="edit-btn" onClick={() => handleEditUser(user)}>✏️ Edit</button>
                            <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>🗑️ Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="user-stats">
                <div className="stat-item">
                  <h4>Total Teachers</h4>
                  <p>{users.teachers.length}</p>
                </div>
                <div className="stat-item">
                  <h4>Active Teachers</h4>
                  <p>{users.teachers.filter(t => t.status === 'active').length}</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="reports-section">
              <h2>📊 Reports</h2>
              
              <div className="report-categories">
                <div className="report-card">
                  <h3>📈 Attendance Reports</h3>
                  <p>Generate detailed attendance reports by class, student, or time period</p>
                  <button className="action-btn primary">Generate Report</button>
                </div>
                
                <div className="report-card">
                  <h3>👥 User Activity Reports</h3>
                  <p>Track system usage and user engagement statistics</p>
                  <button className="action-btn secondary">Generate Report</button>
                </div>
                
                <div className="report-card">
                  <h3>🏫 School Performance</h3>
                  <p>Overall school attendance trends and performance metrics</p>
                  <button className="action-btn tertiary">Generate Report</button>
                </div>
              </div>

              <div className="recent-reports">
                <h3>Recent Reports</h3>
                <div className="reports-list">
                  <div className="report-item">
                    <span>Daily Attendance Report - August 12, 2025</span>
                    <button className="download-btn">📥 Download</button>
                  </div>
                  <div className="report-item">
                    <span>Weekly Summary - August 5-11, 2025</span>
                    <button className="download-btn">📥 Download</button>
                  </div>
                  <div className="report-item">
                    <span>Monthly Statistics - July 2025</span>
                    <button className="download-btn">📥 Download</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="settings-section">
              <h2>⚙️ System Settings</h2>
              
              <div className="settings-grid">
                <div className="setting-card">
                  <h3>🏫 School Information</h3>
                  <div className="setting-item">
                    <label>School Name</label>
                    <input type="text" defaultValue="St. Paul College Calamba" />
                  </div>
                  <div className="setting-item">
                    <label>Academic Year</label>
                    <input type="text" defaultValue="2025-2026" />
                  </div>
                  <button className="action-btn primary">Save Changes</button>
                </div>

                <div className="setting-card">
                  <h3>🕐 Attendance Settings</h3>
                  <div className="setting-item">
                    <label>Class Start Time</label>
                    <input type="time" defaultValue="08:00" />
                  </div>
                  <div className="setting-item">
                    <label>Late Threshold (minutes)</label>
                    <input type="number" defaultValue="15" />
                  </div>
                  <button className="action-btn secondary">Update Settings</button>
                </div>

                <div className="setting-card">
                  <h3>📧 Notification Settings</h3>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Email notifications for absences
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      SMS notifications for parents
                    </label>
                  </div>
                  <button className="action-btn tertiary">Save Preferences</button>
                </div>

                <div className="setting-card">
                  <h3>🔒 Security Settings</h3>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Two-factor authentication
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>Session timeout (minutes)</label>
                    <input type="number" defaultValue="30" />
                  </div>
                  <button className="action-btn primary">Update Security</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardAdmin;
