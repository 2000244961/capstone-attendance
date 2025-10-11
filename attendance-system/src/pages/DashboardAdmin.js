import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from '../shared/components/NotificationIcon';
import NotificationDropdown from '../shared/components/NotificationDropdown';
import InboxIcon from '../shared/components/InboxIcon';
import '../styles/DashboardAdmin.css';
import { useNotifications } from '../shared/hooks/useNotifications';
import ManageStudent from '../features/students/pages/ManageStudent';
import ManageSubjectSection from '../features/students/pages/ManageSubjectSection';
import { fetchSubjectSections } from '../features/students/pages/subjectSectionApi';
import { fetchStudents } from '../api/studentApi';
import { fetchInbox, deleteMessage, sendAdminMessageToMany } from '../api/messageApi';
import { fetchSentMessagesWithRole } from '../api/fetchSentMessagesWithRole';
import { deleteUser as apiDeleteUser } from '../api/userApi';
import { fetchTodayAttendanceSummaryAll } from '../api/attendanceApi';



// Helper to fetch user info by id
async function fetchUserName(userId) {
  try {
    const res = await fetch(`/api/user/${userId}`);
    if (!res.ok) return userId;
    const user = await res.json();
    return user.fullName || user.username || user.email || userId;
  } catch {
    return userId;
  }
}


function DashboardAdmin() {
  // Announcements state (persisted in localStorage)
  const [announcements, setAnnouncements] = useState(() => {
    return JSON.parse(localStorage.getItem('announcements')) || [];
  });
  // Show/hide send message form
  const [showSendMessage, setShowSendMessage] = useState(false);
  // For specific user messaging
  const [adminMessageRecipientType, setAdminMessageRecipientType] = useState('group'); // 'group' or 'specific'
  const [adminMessageSpecificUsers, setAdminMessageSpecificUsers] = useState([]);
  const [adminMessageUserSearch, setAdminMessageUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  // User search state
  const [userSearch, setUserSearch] = useState("");

  // Admin inbox state (must be before any useEffect that uses it)
  const [adminInbox, setAdminInbox] = useState([]);
  const [adminInboxLoading, setAdminInboxLoading] = useState(false);
  const [adminInboxError, setAdminInboxError] = useState(null);

  // Map of senderId to senderName
  const [senderNames, setSenderNames] = useState({});
  // Map of recipientId to recipientName (for sent messages)
  const [recipientNames, setRecipientNames] = useState({});

  // When adminInbox changes, fetch sender and recipient names if missing
  useEffect(() => {
    // Sender names
    const missingSenders = adminInbox.filter(msg => msg.sender && msg.sender.id && !senderNames[msg.sender.id]);
    if (missingSenders.length > 0) {
      Promise.all(missingSenders.map(msg => fetchUserName(msg.sender.id))).then(names => {
        const updates = {};
        missingSenders.forEach((msg, i) => { updates[msg.sender.id] = names[i]; });
        setSenderNames(prev => ({ ...prev, ...updates }));
      });
    }
    // Recipient names (for sent messages)
    const missingRecipients = adminInbox.filter(msg => msg.recipient && msg.recipient.id && !recipientNames[msg.recipient.id]);
    if (missingRecipients.length > 0) {
      Promise.all(missingRecipients.map(msg => fetchUserName(msg.recipient.id))).then(names => {
        const updates = {};
        missingRecipients.forEach((msg, i) => { updates[msg.recipient.id] = names[i]; });
        setRecipientNames(prev => ({ ...prev, ...updates }));
      });
    }
  }, [adminInbox]);
  // Admin message compose state
  const [adminMessageRecipient, setAdminMessageRecipient] = useState("");
  const [adminMessageContent, setAdminMessageContent] = useState("");
  const [adminMessageSending, setAdminMessageSending] = useState(false);
  const [adminMessageError, setAdminMessageError] = useState("");
  const [adminMessageSuccess, setAdminMessageSuccess] = useState("");

  // Announcement title state
  const [adminMessageTitle, setAdminMessageTitle] = useState("");

  // Handler for sending admin message (to be implemented)
  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    setAdminMessageError("");
    setAdminMessageSuccess("");
    setAdminMessageSending(true);
    try {
      // Validation
      if (!adminMessageRecipient || !adminMessageTitle.trim() || !adminMessageContent.trim()) {
        setAdminMessageError("Please select audience, enter a title, and a message.");
        setAdminMessageSending(false);
        return;
      }
      // Get current admin user
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser || !currentUser._id) throw new Error('No admin user found');
      // Send to selected group(s)
      let recipientGroups = [];
      if (adminMessageRecipient === 'both') recipientGroups = ['teachers', 'parents'];
      else recipientGroups = [adminMessageRecipient];
      let allResults = [];
      for (const group of recipientGroups) {
        const results = await sendAdminMessageToMany({
          senderId: currentUser._id,
          senderRole: 'admin',
          recipientGroup: group,
          content: adminMessageContent,
          subject: adminMessageTitle
        });
        allResults = allResults.concat(results);
      }
      // Store the announcement in localStorage for the selected audience(s) and for admin
      const announcementObj = {
        id: `announcement-${Date.now()}`,
        title: adminMessageTitle,
        content: adminMessageContent,
        createdAt: new Date().toISOString(),
        priority: 'medium',
        audience: adminMessageRecipient,
        postedBy: currentUser.fullName || 'Admin',
        readBy: [],
      };
      // Save for admin (table and notification icon)
      const prevAnnouncements = JSON.parse(localStorage.getItem('announcements')) || [];
      const newAnnouncements = [announcementObj, ...prevAnnouncements];
      localStorage.setItem('announcements', JSON.stringify(newAnnouncements));
      setAnnouncements(newAnnouncements);
      // Save for selected audience(s)
      for (const group of recipientGroups) {
        const key = group === 'teachers' ? 'teacherNotifications' : 'parentNotifications';
        const prev = JSON.parse(localStorage.getItem(key)) || [];
        localStorage.setItem(key, JSON.stringify([announcementObj, ...prev]));
      }
      // Add the sent announcement to the admin's own inbox immediately
      setAdminInbox(prev => [
        {
          _id: `local-${Date.now()}`,
          sender: { id: currentUser._id, name: currentUser.fullName || 'Admin' },
          recipientGroup: adminMessageRecipient,
          content: adminMessageContent,
          subject: adminMessageTitle,
          createdAt: new Date().toISOString(),
          isRead: false,
          fromSelf: true
        },
        ...prev
      ]);
      const failed = allResults.filter(r => r.error);
      if (failed.length > 0) {
        setAdminMessageError(`Failed to send to ${failed.length} user(s).`);
      } else {
        setAdminMessageSuccess("Announcement sent to selected audience.");
        setAdminMessageContent("");
        setAdminMessageTitle("");
        setAdminMessageRecipient("");
      }
    } catch (err) {
      setAdminMessageError(err.message || 'Failed to send announcement.');
    } finally {
      setAdminMessageSending(false);
    }
  };
  // Section navigation
  const [activeSection, setActiveSection] = useState('overview');

  // Notifications
  const notifications = useNotifications();

  // User counts for dashboard overview
  const [userCounts, setUserCounts] = useState({ teacher: 0, parent: 0, student: 0 });

  // Attendance summary for today (whole school)
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, late: 0 });

  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserRole, setAddUserRole] = useState('teacher');
  const [addUserForm, setAddUserForm] = useState({
      fullName: '',
      email: '',
      contact: '',
      idNumber: '',
      assignedSections: [],
      assignedSubjects: [],
      sectionToAdd: '',
      subjectToAdd: '',
      linkedStudent: [],
      studentToAdd: '',
      studentSearch: '',
      username: '',
      password: '',
      confirmPassword: '',
      relationship: ''
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Subject/section list
  const [subjectSectionList, setSubjectSectionList] = useState([]);
  // Section attendance summary for report
  const [sectionAttendance, setSectionAttendance] = useState([]);
  // Student list for parent linking
  const [studentList, setStudentList] = useState([]);

  // User list
  const [userList, setUserList] = useState([]);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // Navigation
  const navigate = useNavigate();

  // Handler skeletons (implement logic as needed)
  const handleOpenAddUser = (role) => {
    setAddUserRole(role);
    setShowAddUserModal(true);
  };
  const handleCloseAddUser = () => {
    setShowAddUserModal(false);
    setAddUserError('');
    setAddUserForm({
      fullName: '',
      email: '',
      contact: '',
      idNumber: '',
      assignedSections: [],
      assignedSubjects: [],
      sectionToAdd: '',
      subjectToAdd: '',
      linkedStudent: [],
      studentToAdd: '',
      studentSearch: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
  };
  const handleAddUserFormChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm(prev => ({ ...prev, [name]: value }));
  };
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError("");
    setAddUserLoading(true);
    try {
      // Basic validation
      if (addUserRole === 'teacher') {
        if (!addUserForm.username || !addUserForm.password || !addUserForm.confirmPassword) {
          setAddUserError('Username, password, and confirm password are required.');
          setAddUserLoading(false);
          return;
        }
        if (addUserForm.password !== addUserForm.confirmPassword) {
          setAddUserError('Passwords do not match.');
          setAddUserLoading(false);
          return;
        }
      }
      if (addUserRole === 'parent') {
        if (!addUserForm.linkedStudent || addUserForm.linkedStudent.length === 0) {
          setAddUserError('Please select at least one linked student for the parent.');
          setAddUserLoading(false);
          return;
        }
      }
      // Build payload
      let payload = {
        fullName: addUserForm.fullName,
        email: addUserForm.email,
        contact: addUserForm.contact,
        type: addUserRole,
      };
      if (addUserRole === 'teacher') {
        // Pair up assignedSections and assignedSubjects by index
        let assignedSections = [];
        for (let i = 0; i < Math.max(addUserForm.assignedSections.length, addUserForm.assignedSubjects.length); i++) {
          assignedSections.push({
            sectionName: addUserForm.assignedSections[i] || '',
            subjectName: addUserForm.assignedSubjects[i] || ''
          });
        }
        payload = {
          ...payload,
          username: addUserForm.username,
          password: addUserForm.password,
          idNumber: addUserForm.idNumber,
          assignedSections
        };
      } else if (addUserRole === 'parent') {
        payload = {
          ...payload,
          username: addUserForm.username,
          password: addUserForm.password,
          linkedStudent: addUserForm.linkedStudent,
          relationship: addUserForm.relationship
        };
      }
      // Send to backend
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserError(data.message || 'Failed to add user.');
        setAddUserLoading(false);
        return;
      }
      // Success
      setShowAddUserModal(false);
      setAddUserForm({
        fullName: '',
        email: '',
        contact: '',
        idNumber: '',
        assignedSections: [],
        assignedSubjects: [],
        sectionToAdd: '',
        subjectToAdd: '',
        linkedStudent: [],
        studentToAdd: '',
        studentSearch: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
      setAddUserLoading(false);
      // Refresh both userList and studentList to ensure linked students are up-to-date
      await fetchUsers();
      fetchStudents().then(data => {
        let list = Array.isArray(data) ? data : (data.students || data.list || []);
        setStudentList(list);
      });
      alert(data.message || 'User added successfully.');
    } catch (err) {
      setAddUserError(err.message || 'Failed to add user.');
      setAddUserLoading(false);
    }
  };
  const handleShowProfile = (user) => {
  console.log('[DEBUG] Opening profile modal for user:', user);
  console.log('[DEBUG] Current studentList:', studentList);
  // Normalize linkedStudent for parent users
  let normalizedUser = { ...user };
  if (user.type === 'parent') {
    let linked = user.linkedStudent;
    if (!Array.isArray(linked)) {
      if (typeof linked === 'string' && linked) linked = [linked];
      else if (linked == null) linked = [];
      else linked = Array.from(linked);
    }
    // Convert all IDs to string
    normalizedUser.linkedStudent = linked.map(id => id && id.toString());
    console.log('[DEBUG] Normalized linkedStudent:', normalizedUser.linkedStudent);
  }
  setProfileUser(normalizedUser);
  setShowProfileModal(true);
  };
  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setProfileUser(null);
  };
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user '${username || userId}'? This action cannot be undone.`)) return;
    try {
      await apiDeleteUser(userId);
      setUserList(prev => prev.filter(u => u._id !== userId));
      alert('User deleted successfully.');
      fetchUsers(); // Refresh user list from backend
    } catch (err) {
      alert('Failed to delete user: ' + (err.message || 'Unknown error'));
    }
  };
  // Fetch all users and students, update userList and userCounts
  const fetchUsers = async () => {
    try {
      // Fetch teachers and parents from user API
      const userRes = await fetch('/api/user/list');
      if (!userRes.ok) throw new Error('Failed to fetch users');
      const userData = await userRes.json();
      const users = userData.users || [];
      setUserList(users);
      // Count teachers and parents
      const counts = { teacher: 0, parent: 0, student: 0 };
      users.forEach(u => {
        if (u.type === 'teacher') counts.teacher++;
        else if (u.type === 'parent') counts.parent++;
      });
      // Fetch students from student API
      const studentRes = await fetch('/api/student/list');
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        // studentData can be array or {students: []}
        let students = Array.isArray(studentData) ? studentData : (studentData.students || []);
        counts.student = students.length;
      }
      setUserCounts(counts);
    } catch (err) {
      setUserList([]);
      setUserCounts({ teacher: 0, parent: 0, student: 0 });
      console.error('Failed to fetch users or students:', err);
    }
  };
  const handleLogout = () => {
    // Implement logout logic
    navigate('/login');
  };

  // Fetch admin inbox messages (received + sent)
  const fetchAdminInbox = async () => {
    setAdminInboxLoading(true);
    setAdminInboxError(null);
    try {
      // Get current admin user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser || !currentUser._id) throw new Error('No admin user found');
      // Fetch received and sent messages (with role=admin)
      const [received, sent] = await Promise.all([
        fetchInbox(currentUser._id, 'admin'),
        fetchSentMessagesWithRole(currentUser._id, 'admin')
      ]);
      // Mark sent messages with fromSelf: true for UI
      const sentMarked = sent.map(msg => ({ ...msg, fromSelf: true }));
      // Merge and sort by createdAt desc
      const all = [...received, ...sentMarked].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAdminInbox(all);
    } catch (err) {
      setAdminInboxError(err.message);
      setAdminInbox([]);
    } finally {
      setAdminInboxLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInbox();
    fetchUsers();
    // Fetch subject/section list for dropdowns
    fetchSubjectSections().then(data => {
      let list = Array.isArray(data) ? data : (data.list || data.subjectSections || []);
      setSubjectSectionList(list);
    }).catch(() => setSubjectSectionList([]));
    // Fetch students for parent linking
    fetchStudents().then(data => {
      let list = Array.isArray(data) ? data : (data.students || data.list || []);
      setStudentList(list);
    }).catch(() => setStudentList([]));
    // Fetch today's attendance summary for the whole school
    fetchTodayAttendanceSummaryAll().then(data => {
      setAttendanceData(data);
      // Aggregate per section for report
      if (Array.isArray(data.sections)) {
        setSectionAttendance(data.sections);
      } else if (Array.isArray(data.attendanceBySection)) {
        setSectionAttendance(data.attendanceBySection);
      } else {
        setSectionAttendance([]);
      }
    }).catch(() => {
      setAttendanceData({ present: 0, absent: 0, late: 0 });
      setSectionAttendance([]);
    });
  }, []);

  // Delete message handler
  const handleDeleteAdminMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(id);
      setAdminInbox(msgs => msgs.filter(m => m._id !== id));
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
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
                className={activeSection === 'inbox' ? 'active' : ''}
                onClick={() => setActiveSection('inbox')}
              >
                📥 Inbox
              </li>
              <li 
                className={activeSection === 'users' ? 'active' : ''}
                onClick={() => setActiveSection('users')}
              >
                👥 User Management
              </li>
              <li 
                className={activeSection === 'students' ? 'active' : ''}
                onClick={() => setActiveSection('students')}
              >
                🧑‍🎓 Manage Student
              </li>
              <li 
                className={activeSection === 'subjectSection' ? 'active' : ''}
                onClick={() => setActiveSection('subjectSection')}
              >
                📚 Manage Subject/Section
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
        <div className="admin-main-content">
          <header className="admin-header">
            <div className="admin-header-row">
              <h1 style={{margin:0, fontSize:'2rem', color:'#333', fontWeight:700}}>Admin Dashboard</h1>
              <div className="admin-user-info">
                <NotificationIcon 
                  unreadCount={notifications.unreadCount}
                  onClick={notifications.toggleNotifications}
                  color="#2196F3"
                />
                <InboxIcon onClick={() => setActiveSection('inbox')} />
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
            {/* Admin Inbox Section */}
            {activeSection === 'inbox' && (
              <div className="admin-inbox-section redesigned-inbox" style={{maxWidth: 700, margin: '0 auto', padding: 32}}>
                <h2 style={{fontWeight: 700, fontSize: 28, color: '#2d3748', marginBottom: 18, display:'flex',alignItems:'center',gap:8}}>
                  <span role="img" aria-label="inbox">📥</span> Admin Inbox
                </h2>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
                  <button onClick={()=>setShowSendMessage(v=>!v)} className="dashboard-btn primary">
                    {showSendMessage ? 'Close' : '+ New Message'}
                  </button>
                </div>
                {showSendMessage && (
                  <div className="inbox-compose-card">
                    <h3 style={{marginBottom:12}}>Send Message</h3>
                    {/* ...existing send message form code... */}
                    <form onSubmit={handleSendAdminMessage} style={{display:'flex',flexDirection:'column',gap:12}}>
                      {/* ...existing code for recipient selection and textarea... */}
                      <div style={{display:'flex',gap:12,alignItems:'center'}}>
                        <label style={{fontWeight:500}}>To:</label>
                        <select value={adminMessageRecipientType} onChange={e => setAdminMessageRecipientType(e.target.value)} style={{padding:'6px 12px',borderRadius:6}} required>
                          <option value="group">Group</option>
                          <option value="specific">Specific Users</option>
                        </select>
                        {adminMessageRecipientType === 'group' && (
                          <select value={adminMessageRecipient} onChange={e => setAdminMessageRecipient(e.target.value)} style={{padding:'6px 12px',borderRadius:6}} required>
                            <option value="">Select group</option>
                            <option value="teachers">All Teachers</option>
                            <option value="parents">All Parents</option>
                            <option value="both">All Teachers & Parents</option>
                          </select>
                        )}
                        {adminMessageRecipientType === 'specific' && (
                          <div style={{minWidth:220, position:'relative'}}>
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={adminMessageUserSearch}
                              onChange={e => {
                                setAdminMessageUserSearch(e.target.value);
                                setShowUserDropdown(true);
                              }}
                              onFocus={() => setShowUserDropdown(true)}
                              style={{padding:'6px 10px',borderRadius:5,border:'1px solid #ccc',marginBottom:6,width:'100%'}}
                            />
                            {showUserDropdown && (
                              <div style={{position:'absolute',zIndex:10,top:38,left:0,right:0,maxHeight:140,overflowY:'auto',border:'1px solid #eee',borderRadius:6,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                                {userList.filter(u => (u.type === 'teacher' || u.type === 'parent') &&
                                  !adminMessageSpecificUsers.includes(u._id) && (
                                    !adminMessageUserSearch.trim() ||
                                    (u.fullName && u.fullName.toLowerCase().includes(adminMessageUserSearch.trim().toLowerCase())) ||
                                    (u.username && u.username.toLowerCase().includes(adminMessageUserSearch.trim().toLowerCase())) ||
                                    (u.email && u.email.toLowerCase().includes(adminMessageUserSearch.trim().toLowerCase()))
                                  )
                                ).slice(0,10).map(u => (
                                  <div
                                    key={u._id}
                                    style={{padding:'6px 10px',cursor:'pointer',fontSize:15}}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      setAdminMessageSpecificUsers(prev => [...prev, u._id]);
                                      setAdminMessageUserSearch("");
                                      setShowUserDropdown(false);
                                    }}
                                  >
                                    {u.fullName || u.username} <span style={{color:'#888',fontSize:13}}>({u.type})</span>
                                  </div>
                                ))}
                                {userList.filter(u => (u.type === 'teacher' || u.type === 'parent') &&
                                  !adminMessageSpecificUsers.includes(u._id) && (
                                    !adminMessageUserSearch.trim() ||
                                    (u.fullName && u.fullName.toLowerCase().includes(adminMessageUserSearch.trim().toLowerCase())) ||
                                    (u.username && u.username.toLowerCase().includes(adminMessageUserSearch.trim().toLowerCase())) ||
                                    (u.email && u.email.toLowerCase().includes(adminMessageUserSearch.trim().toLowerCase()))
                                  )
                                ).length === 0 && (
                                  <div style={{color:'#aaa',fontSize:14,padding:'6px 10px'}}>No users found.</div>
                                )}
                              </div>
                            )}
                            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:6}}>
                              {adminMessageSpecificUsers.map(id => {
                                const u = userList.find(u => u._id === id);
                                return u ? (
                                  <span key={id} style={{background:'#e3f2fd',borderRadius:12,padding:'2px 10px',fontSize:13,display:'inline-flex',alignItems:'center',gap:4}}>
                                    {u.fullName || u.username}
                                    <button type="button" style={{marginLeft:2,background:'none',border:'none',color:'#ff4757',cursor:'pointer',fontWeight:'bold'}} onClick={() => setAdminMessageSpecificUsers(prev => prev.filter(i => i !== id))}>×</button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={adminMessageContent}
                        onChange={e => setAdminMessageContent(e.target.value)}
                        placeholder="Type your message here..."
                        rows={3}
                        style={{padding:'8px 12px',borderRadius:6,border:'1px solid #ccc',resize:'vertical'}}
                        required
                      />
                      <div style={{display:'flex',gap:12,alignItems:'center'}}>
                        <button type="submit" className="dashboard-btn primary" disabled={adminMessageSending}>
                          {adminMessageSending ? 'Sending...' : 'Send'}
                        </button>
                        {adminMessageError && <span style={{color:'#e53e3e'}}>{adminMessageError}</span>}
                        {adminMessageSuccess && <span style={{color:'#38a169'}}>{adminMessageSuccess}</span>}
                      </div>
                    </form>
                  </div>
                )}
                <button onClick={fetchAdminInbox} className="dashboard-btn secondary" style={{margin:'16px 0'}}>Refresh Inbox</button>
                <div className="inbox-list">
                  {adminInboxLoading ? (
                    <div className="inbox-loading">Loading...</div>
                  ) : adminInboxError ? (
                    <div className="inbox-error">Error: {adminInboxError}</div>
                  ) : adminInbox.length === 0 ? (
                    <div className="inbox-empty">No messages in your inbox.</div>
                  ) : (
                    <div className="inbox-message-list">
                      {adminInbox.map(msg => {
                        const isSent = msg.fromSelf || (msg.sender && msg.sender.role === 'admin');
                        const isExcuse = msg.type === 'excuse_letter';
                        return (
                          <div key={msg._id} className={`inbox-message-card${isSent ? ' sent' : ' received'}`}>
                            <div className="inbox-message-header">
                              <span className="inbox-message-icon">{isExcuse ? '📄' : (isSent ? '📤' : '📥')}</span>
                              <span className="inbox-message-type">{isExcuse ? 'Excuse Letter' : 'Message'}</span>
                              <span className={`inbox-message-status ${isSent ? 'sent' : 'received'}`}>{isSent ? 'Sent' : 'Received'}</span>
                            </div>
                            <div className="inbox-message-meta">
                              <span className="inbox-message-fromto">{isSent ? 'To:' : 'From:'}</span>
                              <span className="inbox-message-user">{isSent
                                ? (msg.recipient && (msg.recipient.name || recipientNames[msg.recipient.id] || msg.recipient.id))
                                : (senderNames[msg.sender?.id] || msg.sender?.name || 'Unknown')}</span>
                            </div>
                            <div className="inbox-message-content">{msg.content}</div>
                            <div className="inbox-message-footer">
                              <span className="inbox-message-date">{isSent ? 'Sent' : 'Received'}: {new Date(msg.createdAt).toLocaleString()}</span>
                              {msg.status && <span className="inbox-message-status-detail">Status: <b>{msg.status}</b></span>}
                              <button onClick={()=>handleDeleteAdminMessage(msg._id)} className="inbox-message-delete">Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          {/* Dashboard Overview: Total Users Card */}
          {activeSection === 'overview' && (
            <div className="dashboard-overview-section redesigned-overview">
              <h2 style={{fontWeight:700, fontSize:28, color:'#764ba2', marginBottom:24, display:'flex',alignItems:'center',gap:10}}>
                <span role="img" aria-label="dashboard">📊</span> Dashboard Overview
              </h2>
              <div className="dashboard-overview-cards redesigned-cards">
                <div className="dashboard-card redesigned-card" style={{background:'#e3f2fd'}}>
                  <div className="dashboard-card-icon" style={{fontSize:32, color:'#2196F3', marginBottom:8}}>👨‍🏫</div>
                  <div className="dashboard-card-title">Teachers</div>
                  <div className="dashboard-card-value" style={{color:'#2196F3'}}>{userCounts.teacher}</div>
                  <div className="dashboard-card-desc">Registered teachers</div>
                </div>
                <div className="dashboard-card redesigned-card" style={{background:'#e6fffa'}}>
                  <div className="dashboard-card-icon" style={{fontSize:32, color:'#38b2ac', marginBottom:8}}>👨‍👩‍👧</div>
                  <div className="dashboard-card-title">Parents</div>
                  <div className="dashboard-card-value" style={{color:'#38b2ac'}}>{userCounts.parent}</div>
                  <div className="dashboard-card-desc">Registered parents</div>
                </div>
                <div className="dashboard-card redesigned-card" style={{background:'#fffbea'}}>
                  <div className="dashboard-card-icon" style={{fontSize:32, color:'#f6ad55', marginBottom:8}}>🧑‍🎓</div>
                  <div className="dashboard-card-title">Students</div>
                  <div className="dashboard-card-value" style={{color:'#f6ad55'}}>{userCounts.student}</div>
                  <div className="dashboard-card-desc">Registered students</div>
                </div>
                <div className="dashboard-card redesigned-card" style={{background:'#ffeaea'}}>
                  <div className="dashboard-card-icon" style={{fontSize:32, color:'#ff4757', marginBottom:8}}>📝</div>
                  <div className="dashboard-card-title">Today's Attendance</div>
                  <div className="dashboard-attendance-summary-row" style={{display:'flex',gap:18,justifyContent:'center',margin:'16px 0'}}>
                    <div style={{ background: '#e6fffa', borderRadius: 10, padding: '12px 24px', boxShadow: '0 2px 8px rgba(56,178,172,0.10)', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: '1.5rem', color: '#38b2ac', fontWeight: 700 }}>{attendanceData.present}</div>
                      <div style={{ color: '#38b2ac', fontWeight: 600, fontSize:'1rem' }}>Present</div>
                    </div>
                    <div style={{ background: '#fffbea', borderRadius: 10, padding: '12px 24px', boxShadow: '0 2px 8px rgba(246,173,85,0.10)', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: '1.5rem', color: '#f6ad55', fontWeight: 700 }}>{attendanceData.late}</div>
                      <div style={{ color: '#f6ad55', fontWeight: 600, fontSize:'1rem' }}>Late</div>
                    </div>
                    <div style={{ background: '#ffeaea', borderRadius: 10, padding: '12px 24px', boxShadow: '0 2px 8px rgba(255,71,87,0.10)', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: '1.5rem', color: '#ff4757', fontWeight: 700 }}>{attendanceData.absent}</div>
                      <div style={{ color: '#ff4757', fontWeight: 600, fontSize:'1rem' }}>Absent</div>
                    </div>
                  </div>
                  <div className="dashboard-card-desc">Attendance summary for today</div>
                </div>
              </div>
            </div>
          )}
          {/* Reports Section */}
          {activeSection === 'reports' && (
            <div className="dashboard-reports-section">
              <h2>Reports</h2>
              <div className="reports-panel">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Present</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionAttendance.length === 0 ? (
                      <tr><td colSpan="3" style={{textAlign:'center',color:'#888'}}>No attendance data for today.</td></tr>
                    ) : (
                      sectionAttendance.map((sec, idx) => (
                        <tr key={sec.section || idx}>
                          <td>{sec.section || sec.sectionName || `Section ${idx+1}`}</td>
                          <td>{sec.present || 0}</td>
                          <td>{sec.absent || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* User Management Section */}
          {activeSection === 'users' && (
            <div className="dashboard-users-section redesigned-users-section">
              <div className="dashboard-section-header">
                <h2>System Users</h2>
                <div>
                  <button className="dashboard-btn primary" onClick={() => handleOpenAddUser('teacher')}>+ Add Teacher</button>
                  <button className="dashboard-btn primary" style={{ marginLeft: '8px' }} onClick={() => handleOpenAddUser('parent')}>+ Add Parent</button>
                </div>
              </div>
              {/* Add User Modal */}
              {showAddUserModal && (
                <div className="modal-overlay">
                  <div className="modal-content redesigned-modal-content">
                    <h2 className="modal-title">Add {addUserRole === 'teacher' ? 'Teacher' : 'Parent'}</h2>
                    <form onSubmit={handleAddUserSubmit} className="add-user-form redesigned-add-user-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Full Name<span style={{color:'red'}}>*</span></label>
                          <input name="fullName" type="text" value={addUserForm.fullName} onChange={handleAddUserFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Email Address<span style={{color:'red'}}>*</span></label>
                          <input name="email" type="email" value={addUserForm.email} onChange={handleAddUserFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Contact Number</label>
                          <input name="contact" type="text" value={addUserForm.contact} onChange={handleAddUserFormChange} />
                        </div>
                      </div>
                      {addUserRole === 'teacher' && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>ID Number</label>
                              <input name="idNumber" type="text" value={addUserForm.idNumber} onChange={handleAddUserFormChange} />
                            </div>
                            <div className="form-group">
                              <label>Username<span style={{color:'red'}}>*</span></label>
                              <input name="username" type="text" value={addUserForm.username} onChange={handleAddUserFormChange} required />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Password<span style={{color:'red'}}>*</span></label>
                              <input name="password" type="password" value={addUserForm.password} onChange={handleAddUserFormChange} required />
                            </div>
                            <div className="form-group">
                              <label>Confirm Password<span style={{color:'red'}}>*</span></label>
                              <input name="confirmPassword" type="password" value={addUserForm.confirmPassword} onChange={handleAddUserFormChange} required />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Assigned Section(s)</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <select name="sectionToAdd" value={addUserForm.sectionToAdd || ''} onChange={e => setAddUserForm(prev => ({ ...prev, sectionToAdd: e.target.value }))}>
                                  <option value="">Select section</option>
                                  {[...new Set(subjectSectionList.map(item => item.section))].map((section, idx) => (
                                    <option key={section + idx} value={section}>{section}</option>
                                  ))}
                                </select>
                                <button type="button" className="dashboard-btn" onClick={() => {
                                  if (addUserForm.sectionToAdd && !addUserForm.assignedSections?.includes(addUserForm.sectionToAdd)) {
                                    setAddUserForm(prev => ({
                                      ...prev,
                                      assignedSections: [...(prev.assignedSections || []), prev.sectionToAdd],
                                      sectionToAdd: ''
                                    }));
                                  }
                                }}>Add</button>
                              </div>
                              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {(addUserForm.assignedSections || []).map(section => (
                                  <span key={section} style={{ background: '#e3f2fd', borderRadius: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    {section}
                                    <button type="button" style={{ marginLeft: 4, background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAddUserForm(prev => ({ ...prev, assignedSections: prev.assignedSections.filter(s => s !== section) }))}>×</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Assigned Subject(s)</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <select name="subjectToAdd" value={addUserForm.subjectToAdd || ''} onChange={e => setAddUserForm(prev => ({ ...prev, subjectToAdd: e.target.value }))}>
                                  <option value="">Select subject</option>
                                  {[...new Set(subjectSectionList.map(item => item.subject))].map((subject, idx) => (
                                    <option key={subject + idx} value={subject}>{subject}</option>
                                  ))}
                                </select>
                                <button type="button" className="dashboard-btn" onClick={() => {
                                  if (addUserForm.subjectToAdd && !addUserForm.assignedSubjects?.includes(addUserForm.subjectToAdd)) {
                                    setAddUserForm(prev => ({
                                      ...prev,
                                      assignedSubjects: [...(prev.assignedSubjects || []), prev.subjectToAdd],
                                      subjectToAdd: ''
                                    }));
                                  }
                                }}>Add</button>
                              </div>
                              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {(addUserForm.assignedSubjects || []).map(subject => (
                                  <span key={subject} style={{ background: '#e3f2fd', borderRadius: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    {subject}
                                    <button type="button" style={{ marginLeft: 4, background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAddUserForm(prev => ({ ...prev, assignedSubjects: prev.assignedSubjects.filter(s => s !== subject) }))}>×</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {addUserRole === 'parent' && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Username<span style={{color:'red'}}>*</span></label>
                              <input name="username" type="text" value={addUserForm.username} onChange={handleAddUserFormChange} required />
                            </div>
                            <div className="form-group">
                              <label>Password<span style={{color:'red'}}>*</span></label>
                              <input name="password" type="password" value={addUserForm.password} onChange={handleAddUserFormChange} required />
                            </div>
                            <div className="form-group">
                              <label>Confirm Password<span style={{color:'red'}}>*</span></label>
                              <input name="confirmPassword" type="password" value={addUserForm.confirmPassword} onChange={handleAddUserFormChange} required />
                            </div>
                          </div>
                        </>
                      )}
                      {addUserRole === 'parent' && (
                        <div className="form-row">
                          <div className="form-group">
                            <label>Linked Student(s)</label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                              <input
                                type="text"
                                placeholder="Search student name or ID..."
                                value={addUserForm.studentSearch || ''}
                                onChange={e => setAddUserForm(prev => ({ ...prev, studentSearch: e.target.value }))}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: 5, border: '1px solid #ccc' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <select name="studentToAdd" value={addUserForm.studentToAdd || ''} onChange={e => setAddUserForm(prev => ({ ...prev, studentToAdd: e.target.value }))}>
                                <option value="">Select student</option>
                                {studentList.length > 0 ? (
                                  studentList.filter(student =>
                                    (addUserForm.studentSearch || '').trim() === '' ||
                                    (student.fullName && student.fullName.toLowerCase().includes((addUserForm.studentSearch || '').toLowerCase())) ||
                                    (student.studentId && student.studentId.toLowerCase().includes((addUserForm.studentSearch || '').toLowerCase()))
                                  ).map(student => (
                                    <option key={student._id || student.studentId} value={student._id || student.studentId}>
                                      {student.fullName} ({student.studentId})
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>No students found</option>
                                )}
                              </select>
                              <button type="button" className="dashboard-btn" onClick={() => {
                                if (addUserForm.studentToAdd) {
                                  setAddUserForm(prev => {
                                    const alreadyAdded = prev.linkedStudent || [];
                                    if (!alreadyAdded.includes(prev.studentToAdd)) {
                                      return {
                                        ...prev,
                                        linkedStudent: [...alreadyAdded, prev.studentToAdd],
                                        studentToAdd: ''
                                      };
                                    } else {
                                      return {
                                        ...prev,
                                        studentToAdd: ''
                                      };
                                    }
                                  });
                                }
                              }}>Add</button>
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {[...(addUserForm.linkedStudent || [])]
                                .filter((id, idx, arr) => arr.indexOf(id) === idx)
                                .map(studentId => {
                                  const student = studentList.find(s => (s._id || s.studentId) === studentId);
                                  return (
                                    <span key={studentId} style={{ background: '#e3f2fd', borderRadius: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      {student ? `${student.fullName} (${student.studentId || student._id})` : studentId}
                                      <button type="button" style={{ marginLeft: 4, background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAddUserForm(prev => ({ ...prev, linkedStudent: prev.linkedStudent.filter(s => s !== studentId) }))}>×</button>
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                          <div className="form-group">
                          </div>
                        </div>
                      )}
                      {/* ...other parent fields... */}
                      <div className="form-actions">
                        <button type="submit" className="dashboard-btn primary" disabled={addUserLoading}>Add User</button>
                        <button type="button" className="dashboard-btn" onClick={handleCloseAddUser}>Cancel</button>
                      </div>
                      {addUserError && <div style={{ color: 'red', marginTop: 8 }}>{addUserError}</div>}
                    </form>
                  </div>
                </div>
              )}
              {/* User Search Bar */}
              <div className="dashboard-user-search-row">
                <input
                  type="text"
                  className="dashboard-user-search-input"
                  placeholder="Search users by name, username, or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <button
                  className="dashboard-btn"
                  type="button"
                  onClick={() => setUserSearch(userSearch.trim())}
                >Search</button>
                <button
                  className="dashboard-btn"
                  type="button"
                  onClick={() => setUserSearch("")}
                  style={{ background: '#eee', color: '#333' }}
                >Clear</button>
              </div>
              <div className="dashboard-user-list redesigned-user-list">
                {userList.filter(u => u.type === 'teacher' || u.type === 'parent')
                  .filter(u => {
                    if (!userSearch.trim()) return true;
                    const search = userSearch.trim().toLowerCase();
                    return (
                      (u.fullName && u.fullName.toLowerCase().includes(search)) ||
                      (u.username && u.username.toLowerCase().includes(search)) ||
                      (u.email && u.email.toLowerCase().includes(search))
                    );
                  }).length === 0 ? (
                  <div className="dashboard-user-empty">No teachers or parents found.</div>
                ) : (
                  userList.filter(u => u.type === 'teacher' || u.type === 'parent')
                    .filter(u => {
                      if (!userSearch.trim()) return true;
                      const search = userSearch.trim().toLowerCase();
                      return (
                        (u.fullName && u.fullName.toLowerCase().includes(search)) ||
                        (u.username && u.username.toLowerCase().includes(search)) ||
                        (u.email && u.email.toLowerCase().includes(search))
                      );
                    })
                    .map((user, idx) => (
                      <div className="dashboard-user-card" key={user._id || idx}>
                        <div className="dashboard-user-avatar" style={{background:user.type==='teacher'?'#e3f2fd':'#ffeaea',color:user.type==='teacher'?'#2196F3':'#ff4757'}}>
                          {user.fullName ? user.fullName[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : '👤')}
                        </div>
                        <div className="dashboard-user-info">
                          <div className="dashboard-user-name">{user.fullName || user.username}</div>
                          <div className="dashboard-user-meta">
                            <span className={`dashboard-user-role ${user.type}`}>{user.type.charAt(0).toUpperCase() + user.type.slice(1)}</span>
                            <span className="dashboard-user-email">{user.email}</span>
                          </div>
                          <div className="dashboard-user-status-row">
                            <span className="status-badge active">Active</span>
                            <span className="dashboard-user-lastlogin">Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</span>
                          </div>
                        </div>
                        <div className="dashboard-user-actions">
                          <button className="dashboard-btn small" onClick={() => handleShowProfile(user)}>Profile</button>
                          <button className="dashboard-btn small">Edit</button>
                          <button className="dashboard-btn small danger" onClick={() => handleDeleteUser(user._id, user.username)}>Delete</button>
                        </div>
                      </div>
                    ))
                )}
              </div>
              {/* Teacher Profile Modal */}
              {showProfileModal && profileUser && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2 style={{marginBottom:8}}>
                      {profileUser.type === 'teacher' ? 'Teacher Profile' : profileUser.type === 'parent' ? 'Parent Profile' : 'User Profile'}
                    </h2>
                    <div style={{display:'flex',alignItems:'center',gap:24}}>
                      <div>
                        {/* Placeholder for photo, can be replaced with real photo field */}
                        <div style={{width:100,height:100,borderRadius:'50%',background:'#e3f2fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'#2196F3'}}>
                          {profileUser.fullName ? profileUser.fullName[0] : '👤'}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:22,fontWeight:600}}>{profileUser.fullName || profileUser.username}</div>
                        <div style={{marginTop:8,color:'#555'}}>Role: {profileUser.type}</div>
                        <div style={{marginTop:8,color:'#555'}}>Email: {profileUser.email}</div>
                        {/* Bio placeholder, can be extended */}
                        <div style={{marginTop:12}}><strong>Bio:</strong> {profileUser.bio || 'No bio set.'}</div>
                        {/* Teacher: Show handled sections/subjects */}
                        {profileUser.type === 'teacher' && Array.isArray(profileUser.assignedSections) && profileUser.assignedSections.length > 0 && (
                          <div style={{marginTop:12}}>
                            <strong>Handled Sections/Subjects:</strong>
                            <ul style={{margin:'8px 0 0 16px',padding:0}}>
                              {profileUser.assignedSections.map((sec, idx) => (
                                <li key={idx} style={{marginBottom:4}}>
                                  {sec.sectionName ? <span>Section: <b>{sec.sectionName}</b></span> : null}
                                  {sec.subjectName ? <span> &nbsp;|&nbsp; Subject: <b>{sec.subjectName}</b></span> : null}
                                  {(!sec.sectionName && !sec.subjectName) ? <span>Unknown</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Parent: Show linked students (names) */}
                        {profileUser.type === 'parent' && (
                          <div style={{marginTop:12}}>
                            <strong>Linked Student(s):</strong>
                            <ul style={{margin:'8px 0 0 16px',padding:0}}>
                              {(() => {
                                // Debug log for profileUser
                                console.log('[ADMIN MODAL] profileUser:', profileUser);
                                let linked = profileUser.linkedStudent;
                                if (!Array.isArray(linked)) {
                                  if (typeof linked === 'string' && linked) linked = [linked];
                                  else if (linked == null) linked = [];
                                  else linked = Array.from(linked);
                                }
                                const linkedStr = linked.map(id => id && id.toString());
                                console.log('[ADMIN MODAL] LinkedStudent:', linkedStr);
                                console.log('[ADMIN MODAL] studentList:', studentList);
                                if (!linkedStr || linkedStr.length === 0) {
                                  return <li style={{color:'#888'}}>No linked students.</li>;
                                }
                                return linkedStr.map((studentId, idx) => {
                                  const student = studentList.find(s => (s._id && s._id.toString()) === studentId || (s.studentId && s.studentId.toString()) === studentId);
                                  return (
                                    <li key={idx} style={{marginBottom:4}}>
                                      {student ? `${student.fullName} (${student.studentId || student._id})` : studentId}
                                    </li>
                                  );
                                });
                              })()}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{marginTop:24,textAlign:'right'}}>
                      <button className="dashboard-btn" onClick={handleCloseProfile}>Close</button>
                    </div>
                  </div>
                  <style>{`
                    .modal-overlay {
                      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 9999;
                    }
                    .modal-content {
                      background: #fff; padding: 32px 24px; border-radius: 10px; box-shadow: 0 2px 16px rgba(0,0,0,0.15); min-width: 340px; max-width: 95vw;
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}
          {/* Announcements Section */}
          {activeSection === 'announcements' && (
            <div className="dashboard-announcements-section" style={{maxWidth: 900, margin: '0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <span style={{fontSize:32, color:'#2196F3'}}>📢</span>
                <h2 style={{fontWeight:700, fontSize:28, color:'#2196F3', margin:0}}>Announcements</h2>
              </div>
              <div className="announcement-form-card" style={{background:'#f8fafc',borderRadius:16,boxShadow:'0 2px 16px rgba(33,150,243,0.08)',padding:'32px 28px',marginBottom:32}}>
                <form className="announcement-form" onSubmit={handleSendAdminMessage} style={{display:'flex',flexDirection:'column',gap:20}}>
                  <div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap'}}>
                    <select value={adminMessageRecipient} onChange={e=>setAdminMessageRecipient(e.target.value)} style={{padding:'12px 18px',borderRadius:10,border:'1.5px solid #b6d0f7',fontWeight:600,minWidth:200,background:'#fff'}} required>
                      <option value="">Select Audience</option>
                      <option value="teachers">All Teachers</option>
                      <option value="parents">All Parents</option>
                      <option value="both">All Teachers & Parents</option>
                    </select>
                    <input type="text" placeholder="Announcement Title" style={{flex:1,padding:'12px 18px',borderRadius:10,border:'1.5px solid #b6d0f7',fontWeight:500,background:'#fff'}} value={adminMessageTitle || ''} onChange={e=>setAdminMessageTitle(e.target.value)} required />
                  </div>
                  <textarea placeholder="Write your announcement here..." style={{padding:'14px 18px',borderRadius:10,border:'1.5px solid #b6d0f7',fontWeight:500,minHeight:90,background:'#fff'}} value={adminMessageContent} onChange={e=>setAdminMessageContent(e.target.value)} required />
                  <div style={{display:'flex',justifyContent:'flex-end',gap:16,alignItems:'center'}}>
                    {adminMessageError && <span style={{color:'#ff4757',fontWeight:500}}>{adminMessageError}</span>}
                    {adminMessageSuccess && <span style={{color:'#38b2ac',fontWeight:500}}>{adminMessageSuccess}</span>}
                    <button type="submit" className="dashboard-btn primary" disabled={adminMessageSending} style={{padding:'12px 40px',fontWeight:700,fontSize:18,background:'#2196F3',color:'#fff',borderRadius:10,boxShadow:'0 2px 8px rgba(33,150,243,0.10)'}}>
                      {adminMessageSending ? 'Sending...' : 'Announce'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="announcement-table-card" style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 16px rgba(33,150,243,0.06)',padding:'24px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <span style={{fontSize:22,color:'#2196F3'}}>📋</span>
                  <h3 style={{margin:0,fontWeight:600,fontSize:22,color:'#2196F3'}}>Announcement History</h3>
                </div>
                <table className="dashboard-table" style={{background:'#fff',borderRadius:10,overflow:'hidden'}}>
                  <thead style={{background:'#e3f2fd'}}>
                    <tr>
                      <th style={{padding:'12px 8px'}}>Title</th>
                      <th style={{padding:'12px 8px'}}>Posted By</th>
                      <th style={{padding:'12px 8px'}}>Date</th>
                      <th style={{padding:'12px 8px'}}>Audience</th>
                      <th style={{padding:'12px 8px'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.length === 0 ? (
                      <tr><td colSpan="5" style={{textAlign:'center',color:'#888',padding:'18px'}}>No announcements yet.</td></tr>
                    ) : (
                      announcements.map((a, idx) => (
                        <tr key={a.id || idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                          <td style={{padding:'10px 8px',fontWeight:600}}>{a.title}</td>
                          <td style={{padding:'10px 8px'}}>{a.postedBy || 'Admin'}</td>
                          <td style={{padding:'10px 8px'}}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</td>
                          <td style={{padding:'10px 8px'}}>{a.audience === 'both' ? 'All' : a.audience === 'teachers' ? 'Teachers' : 'Parents'}</td>
                          <td style={{padding:'10px 8px'}}><span className="status-badge active">Published</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        {/* Manage Student Section */}
        {activeSection === 'students' && (
          <div className="dashboard-manage-student-section">
            <ManageStudent 
              refreshDashboard={fetchUsers}
              goToOverview={() => setActiveSection('overview')} 
            />
          </div>
        )}
    {/* Manage Subject/Section Section */}
    {activeSection === 'subjectSection' && (
      <div className="dashboard-manage-subject-section">
        <ManageSubjectSection />
      </div>
    )}

        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
