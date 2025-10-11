
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/DashboardParent.css';
import { fetchInbox, fetchSentMessages, sendExcuseLetter, deleteMessage } from '../../../api/messageApi';
import { fetchAllTeachers } from '../../../api/userApi';
import { fetchStudents } from '../../../api/studentApi';
import { fetchAttendance } from '../../../../src/utils/attendanceApi';

function DashboardParent() {
  // State for selected student details
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  // Inbox messages state must be declared before any use
  const [inboxMessages, setInboxMessages] = useState([]);
  // Unread inbox count
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  useEffect(() => {
    setUnreadInboxCount(Array.isArray(inboxMessages) ? inboxMessages.filter(msg => msg.status === 'unread').length : 0);
  }, [inboxMessages]);

  // Mark as read handler
  async function handleMarkAsRead(msgId) {
    try {
      const { markMessageAsRead } = await import('../../../api/markMessageAsRead');
      await markMessageAsRead(msgId);
      setInboxMessages(msgs => msgs.map(m => m._id === msgId ? { ...m, status: 'read' } : m));
    } catch {}
  }
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [excuseLetters, setExcuseLetters] = useState([]);
  const [excuseForm, setExcuseForm] = useState({ reason: '', file: null, date: '', teacher: '' });
  const [teachers, setTeachers] = useState([]);
  // Fetch teachers on mount
  useEffect(() => {
    fetchAllTeachers().then(setTeachers).catch(() => setTeachers([]));
  }, []);
  const [excuseStatus, setExcuseStatus] = useState('');
  // Get current parent user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userId = currentUser?._id;
  const userRole = currentUser?.type || 'parent';
  let linkedStudentIds = [];
  if (Array.isArray(currentUser?.linkedStudent)) linkedStudentIds = currentUser.linkedStudent;
  else if (typeof currentUser?.linkedStudent === 'string' && currentUser.linkedStudent) linkedStudentIds = [currentUser.linkedStudent];
  else if (currentUser?.linkedStudent != null) linkedStudentIds = Array.from(currentUser.linkedStudent);
  // State for all students and linked students
  const [allStudents, setAllStudents] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  // Attendance records for linked students
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  // Fetch attendance records for linked students
  useEffect(() => {
    async function fetchAndFilterAttendance() {
      try {
        const allAttendance = await fetchAttendance();
        // Filter attendance for linked students only
        const linkedIds = linkedStudents.map(s => s._id || s.studentId);
        const filtered = Array.isArray(allAttendance)
          ? allAttendance.filter(a => linkedIds.includes(a.studentId || a.student_id || a.student?._id))
          : [];
        setAttendanceRecords(filtered);
      } catch {
        setAttendanceRecords([]);
      }
    }
    if (linkedStudents.length > 0) {
      fetchAndFilterAttendance();
    } else {
      setAttendanceRecords([]);
    }
  }, [JSON.stringify(linkedStudents)]);

  // Fetch all students and filter linked students
  useEffect(() => {
    fetchStudents().then(data => {
      let students = Array.isArray(data) ? data : (data.students || data.list || []);
      setAllStudents(students);
      // Filter for linked students
      if (linkedStudentIds.length > 0) {
        setLinkedStudents(students.filter(s => linkedStudentIds.includes(s._id || s.studentId)));
      } else {
        setLinkedStudents([]);
      }
    }).catch(() => {
      setAllStudents([]);
      setLinkedStudents([]);
    });
  }, [userId, JSON.stringify(linkedStudentIds)]);
  // Remove hardcoded teacherId and teacherRole

  // Delete a message from inbox
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(id);
      setInboxMessages(msgs => msgs.filter(m => m._id !== id));
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  const handleExcuseFormChange = (e) => {
    const { name, value, files } = e.target;

      const handleDeleteMessage = async (id) => {
      if (!window.confirm('Are you sure you want to delete this message?')) return;
      try {
        await deleteMessage(id);
        setInboxMessages(msgs => msgs.filter(m => m._id !== id));
      } catch (err) {
        alert('Failed to delete message: ' + err.message);
      }
      };
    if (name === 'file') {
      setExcuseForm(prev => ({ ...prev, file: files[0] }));
    } else {
      setExcuseForm(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleExcuseFormSubmit = async (e) => {
    e.preventDefault();
    setExcuseStatus('Submitting...');
    const selectedTeacher = teachers.find(t => t._id === excuseForm.teacher);
    if (!selectedTeacher) {
      setExcuseStatus('Please select a valid teacher.');
      return;
    }
    // Debug: log teacherId and form
    console.log('[PARENT] Submitting excuse letter to teacherId:', excuseForm.teacher, 'form:', excuseForm);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('[PARENT] Current user:', currentUser);
    // Also log all teachers for dropdown
    console.log('[PARENT] Teachers list:', teachers);
    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('senderId', userId);
      formData.append('senderRole', userRole);
      formData.append('recipientId', selectedTeacher._id);
      formData.append('recipientRole', 'teacher');
      formData.append('reason', excuseForm.reason);
      formData.append('excuseDate', excuseForm.date);
      formData.append('subject', 'Excuse Letter');
      formData.append('type', 'excuse_letter');
      if (excuseForm.file) {
        formData.append('file', excuseForm.file);
      }
      await sendExcuseLetter(formData, true); // pass true to indicate FormData
      setExcuseStatus('Submitted!');
      setExcuseForm({ reason: '', file: null, date: '', teacher: '' });
      // Refresh sent excuse letters
      fetchSent();
      setTimeout(() => setExcuseStatus(''), 2000);
    } catch (err) {
      setExcuseStatus('Failed to submit: ' + err.message);
    }
  };

  // Fetch inbox and sent messages
  const fetchInboxMessages = async () => {
    try {
      const data = await fetchInbox(userId, userRole);
      setInboxMessages(data);
    } catch (err) {
      setInboxMessages([]);
    }
  };
  const fetchSent = async () => {
    try {
      const data = await fetchSentMessages(userId);
      setExcuseLetters(data.filter(msg => msg.type === 'excuse'));
    } catch (err) {
      setExcuseLetters([]);
    }
  };

  useEffect(() => {
    if (activeSection === 'inbox') fetchInboxMessages();
    if (activeSection === 'excuse') fetchSent();
    // eslint-disable-next-line
  }, [activeSection]);

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">SPCC Parent Portal</h2>
        <nav className="admin-nav">
          <ul>
            <li className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>Overview</li>
            <li className={activeSection === 'students' ? 'active' : ''} onClick={() => setActiveSection('students')}>
              Linked Students
            </li>
            <li className={activeSection === 'attendance' ? 'active' : ''} onClick={() => setActiveSection('attendance')}>Attendance</li>
            <li className={activeSection === 'announcements' ? 'active' : ''} onClick={() => setActiveSection('announcements')}>Announcements</li>
            <li className={activeSection === 'inbox' ? 'active' : ''} onClick={() => setActiveSection('inbox')}>
              Inbox {unreadInboxCount > 0 && (<span style={{ color: 'red', fontWeight: 'bold', marginLeft: 6 }}>{unreadInboxCount}</span>)}
            </li>
            <li className={activeSection === 'excuse' ? 'active' : ''} onClick={() => setActiveSection('excuse')}>Excuse Letter</li>
            <li onClick={() => navigate('/')}>Logout</li>
          </ul>
        </nav>
      </aside>
      {/* Main content */}
      <main className="admin-main-content">
        {activeSection === 'inbox' && (
          <div style={{ maxWidth: '1000px', minWidth: 'min(100vw, 600px)', margin: '0 auto', padding: '32px 0 32px 0' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 28, color: '#2d3748' }}>
              <span role="img" aria-label="inbox">📥</span> Inbox
            </h2>
            {/* Parent Send Message Form */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '18px 24px', boxShadow: '0 2px 8px rgba(33,150,243,0.07)', marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12 }}>Send Message</h3>
              <form /* onSubmit={handleSendParentMessage} */ style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label style={{ fontWeight: 500 }}>Recipient Type:</label>
                  <select /* value={recipientType} onChange={e => { setRecipientType(e.target.value); setRecipientUserId(''); }} */ style={{ padding: '6px 12px', borderRadius: 6 }} required>
                    <option value="">Select type</option>
                    <option value="all">All Teachers & Admins</option>
                    <option value="teacher">All Teachers</option>
                    <option value="admin">All Admins</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>
                {/* Recipient user search and selection for 'specific' */}
                {/* ...implement user search and selection as in teacher inbox... */}
                <textarea
                  /* value={messageContent} onChange={e => setMessageContent(e.target.value)} */
                  placeholder="Type your message here..."
                  rows={3}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
                  required
                />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button type="submit" className="dashboard-btn primary" /* disabled={messageSending} */>
                    {/* {messageSending ? 'Sending...' : 'Send'} */}Send
                  </button>
                  {/* {messageError && <span style={{ color: '#e53e3e' }}>{messageError}</span>} */}
                  {/* {messageSuccess && <span style={{ color: '#38a169' }}>{messageSuccess}</span>} */}
                </div>
              </form>
            </div>
            <button onClick={fetchInboxMessages} style={{ margin: '16px 0', padding: '8px 18px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Refresh Inbox</button>
            <div style={{ background: '#f7fafc', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '32px 48px', marginTop: 24, minHeight: 500, maxHeight: '70vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
              {inboxMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888' }}>No messages in your inbox.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {inboxMessages.map(msg => {
                    // Determine if sent or received (sent if sender is current parent)
                    const isSent = msg.senderId === userId;
                    const senderName = isSent ? (currentUser?.fullName || currentUser?.name || currentUser?.username || 'You') : (msg.senderName || 'Unknown');
                    const avatar = isSent
                      ? (currentUser?.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser?.fullName || currentUser?.name || currentUser?.username || 'Parent'))
                      : ('https://ui-avatars.com/api/?name=' + encodeURIComponent(senderName));
                    return (
                      <div key={msg._id} style={{
                        display: 'flex',
                        flexDirection: isSent ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 12,
                        justifyContent: isSent ? 'flex-end' : 'flex-start',
                      }}>
                        <img src={avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#e3f2fd', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }} />
                        <div style={{
                          background: isSent ? '#3182ce' : '#fff',
                          color: isSent ? '#fff' : '#333',
                          borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          padding: '14px 18px',
                          minWidth: 80,
                          maxWidth: 340,
                          boxShadow: '0 2px 8px rgba(33,150,243,0.07)',
                          marginBottom: 2,
                          textAlign: 'left',
                          position: 'relative',
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>
                            {isSent ? 'You' : senderName}
                            {msg.type === 'excuse_letter' && <span style={{ marginLeft: 8, color: '#38b2ac' }}>Excuse Letter</span>}
                          </div>
                          <div style={{ fontSize: '1.05rem', marginBottom: 6, wordBreak: 'break-word' }}>{msg.content}</div>
                          {msg.type === 'excuse_letter' && msg.fileUrl && (
                            <div style={{ margin: '8px 0' }}>
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download style={{ color: isSent ? '#fff' : '#3182ce', fontWeight: 600, textDecoration: 'underline' }}>
                                View Excuse Letter File
                              </a>
                            </div>
                          )}
                          <div style={{ fontSize: '0.92rem', color: isSent ? '#e0e8f7' : '#888', marginTop: 8 }}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            {msg.status === 'unread' && !isSent && (
                              <button onClick={() => handleMarkAsRead(msg._id)} style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Mark as Read</button>
                            )}
                            <button onClick={() => handleDeleteMessage(msg._id)} style={{ background: '#fff', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {activeSection === 'excuse' && (
          <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8, fontWeight: 900, fontSize:'2rem', background: 'linear-gradient(90deg, #2196F3 0%, #38b2ac 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1, textAlign:'center' }}>
              <span style={{marginRight:8, fontSize:'2.2rem'}}>📄</span>Excuse Letter Submission
            </h2>
            <form onSubmit={handleExcuseFormSubmit} style={{background:'linear-gradient(135deg, #e6fffa 0%, #f7fafc 100%)',borderRadius:18,padding:'32px 40px',boxShadow:'0 6px 32px rgba(33,150,243,0.13)',display:'flex',flexDirection:'column',gap:20,maxWidth:540,margin:'0 auto',border:'2px solid #38b2ac'}}>
              <div style={{fontWeight:700,fontSize:'1.15rem',marginBottom:4,color:'#2196F3'}}>Select Teacher:</div>
              <select name="teacher" value={excuseForm.teacher} onChange={handleExcuseFormChange} required style={{marginBottom:8,background:'#e6fffa',borderRadius:8,padding:'10px 0',border:'1px solid #38b2ac',fontSize:'1.05rem'}}>
                <option value="">-- Select a Teacher --</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.fullName || t.name || t.username}</option>
                ))}
              </select>
              {teachers.length === 0 && (
                <div style={{color:'red',marginTop:8}}>No teachers found. Please contact the administrator.</div>
              )}
              <div style={{fontWeight:700,fontSize:'1.15rem',marginBottom:4,color:'#2196F3'}}>Reason for Absence:</div>
              <textarea name="reason" value={excuseForm.reason} onChange={handleExcuseFormChange} required style={{minHeight:70,padding:14,borderRadius:10,border:'1.5px solid #38b2ac',fontSize:'1.05rem',background:'#fff',boxShadow:'0 2px 8px rgba(33,150,243,0.07)'}} placeholder="Describe the reason for absence..." />
              <div style={{fontWeight:700,fontSize:'1.15rem',marginBottom:4,color:'#2196F3'}}>Date of Absence:</div>
              <input type="date" name="date" value={excuseForm.date} onChange={handleExcuseFormChange} required style={{marginBottom:8,background:'#e6fffa',borderRadius:8,padding:'8px 0',border:'1px solid #38b2ac'}} />
              <div style={{fontWeight:700,fontSize:'1.15rem',marginBottom:4,color:'#2196F3'}}>Upload Supporting Document:</div>
              <input type="file" name="file" accept="image/*,.pdf,.doc,.docx" onChange={handleExcuseFormChange} style={{marginBottom:8,background:'#e6fffa',borderRadius:8,padding:'8px 0',border:'1px solid #38b2ac'}} />
              <button type="submit" style={{marginTop:8,background:'linear-gradient(90deg, #2196F3 0%, #38b2ac 100%)',color:'#fff',borderRadius:10,padding:'12px 0',fontWeight:900,border:'none',fontSize:'1.15rem',cursor:'pointer',boxShadow:'0 2px 8px rgba(33,150,243,0.13)',letterSpacing:1,transition:'transform 0.1s'}}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{marginRight:8,fontSize:'1.2rem'}}>📨</span>Submit Excuse Letter
              </button>
              {excuseStatus && <div style={{marginTop:8,color:'#38b2ac',fontWeight:700,fontSize:'1.08rem',textAlign:'center',animation:'fadeIn 1s'}}>{excuseStatus}</div>}
            </form>
            <div style={{marginTop:40}}>
              <h3 style={{fontWeight:900,color:'#2196F3',marginBottom:20,fontSize:'1.3rem',textAlign:'center',letterSpacing:1}}><span style={{marginRight:8,fontSize:'1.3rem'}}>�</span>Submitted Excuse Letters</h3>
              {excuseLetters.length === 0 ? (
                <div style={{background:'linear-gradient(90deg, #fffbea 0%, #e6fffa 100%)',padding:'22px',borderRadius:12,color:'#f6ad55',fontWeight:700,boxShadow:'0 2px 8px rgba(246,173,85,0.10)',textAlign:'center',fontSize:'1.08rem'}}>No excuse letters submitted yet.</div>
              ) : (
                <div style={{display:'flex',flexWrap:'wrap',gap:24,justifyContent:'center'}}>
                  {excuseLetters.map(letter => (
                    <div key={letter.id} style={{background:'linear-gradient(135deg, #2196F3 0%, #38b2ac 100%)',borderRadius:16,boxShadow:'0 6px 32px rgba(33,150,243,0.13)',padding:'24px 28px',minWidth:260,maxWidth:340,display:'flex',flexDirection:'column',gap:12,position:'relative',color:'#fff',border:'2px solid #fff'}}>
                      <div style={{position:'absolute',top:18,right:18,fontSize:'2rem',opacity:0.13}}>📄</div>
                      <div style={{fontWeight:900,fontSize:'1.15rem',marginBottom:4,letterSpacing:1}}><span style={{marginRight:8}}>📝</span>{letter.reason}</div>
                      {letter.approverName && (
                        <div style={{color:'#fffbea',fontWeight:700,marginBottom:4}}>Approved by: {letter.approverName}</div>
                      )}
                      <div style={{fontSize:'1.05rem',color:'#e6fffa'}}>
                        <span style={{fontWeight:700}}>File:</span> {letter.fileName ? (
                          <span style={{color:'#fff',background:'rgba(56,178,172,0.18)',borderRadius:6,padding:'2px 8px',marginLeft:4}}><span style={{marginRight:4}}>📎</span>{letter.fileName}</span>
                        ) : 'N/A'}
                      </div>
                      <div style={{fontWeight:900,fontSize:'1.05rem',marginTop:6}}>
                        Status: {letter.status === 'Pending' ? (
                          <span style={{color:'#fffbea',background:'rgba(246,173,85,0.18)',borderRadius:6,padding:'2px 12px',fontWeight:700,animation:'pulse 1.2s infinite'}}>
                            <span style={{marginRight:4}}>⏳</span>Pending
                          </span>
                        ) : (
                          <span style={{color:'#e6fffa',background:'rgba(56,178,172,0.18)',borderRadius:6,padding:'2px 12px',fontWeight:700}}>
                            <span style={{marginRight:4}}>✔️</span>{letter.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Add keyframes for pulse animation */}
            <style>{`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(246,173,85,0.25); }
                70% { box-shadow: 0 0 0 10px rgba(246,173,85,0.05); }
                100% { box-shadow: 0 0 0 0 rgba(246,173,85,0.0); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        )}
        {activeSection === 'overview' && (
          <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8, fontWeight: 800, color: '#2196F3', letterSpacing: 1 }}>Dashboard Overview</h2>
            <p style={{ marginBottom: 24, fontSize: '1.1rem', color: '#2d3e50', fontWeight: 500 }}>Welcome, Parent! Here is a quick summary of your account.</p>
            <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px', background: 'linear-gradient(135deg, #38b2ac 0%, #2196F3 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(33,150,243,0.10)', textAlign: 'center', color: '#fff', minWidth: 180, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 28, opacity: 0.15 }}>👨‍👧‍👦</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>{linkedStudents.length}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Linked Students</div>
              </div>
              <div style={{ flex: '1 1 220px', background: 'linear-gradient(135deg, #2196F3 0%, #38b2ac 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(33,150,243,0.10)', textAlign: 'center', color: '#fff', minWidth: 180, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 28, opacity: 0.15 }}>📋</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>{attendanceRecords.length}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Attendance Records</div>
              </div>
              <div style={{ flex: '1 1 220px', background: 'linear-gradient(135deg, #f6ad55 0%, #ff4757 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(255,71,87,0.10)', textAlign: 'center', color: '#fff', minWidth: 180, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 28, opacity: 0.15 }}>📢</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>{inboxMessages.filter(m => m.status === 'unread').length}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Unread Announcements</div>
              </div>
            </div>
            <div style={{ marginBottom: 32, background: '#f7fafc', borderRadius: 12, padding: '24px 32px', boxShadow: '0 2px 8px rgba(33,150,243,0.07)' }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700, color: '#2196F3' }}>Recently Linked Students</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                {linkedStudents.length === 0 ? (
                  <li style={{ color: '#888', fontWeight: 500 }}>No linked students found.</li>
                ) : (
                  linkedStudents.map(s => (
                    <li key={s._id || s.studentId} style={{ background: '#e6fffa', borderRadius: 8, padding: '14px 24px', fontWeight: 600, color: '#38b2ac', minWidth: 160, boxShadow: '0 2px 8px rgba(56,178,172,0.10)' }}>
                      {s.fullName || s.name} <span style={{ color: '#2196F3', fontWeight: 500 }}>({s.section || s.sectionName || '-'})</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div style={{ marginBottom: 32, background: '#fffbea', borderRadius: 12, padding: '24px 32px', boxShadow: '0 2px 8px rgba(246,173,85,0.10)' }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700, color: '#f6ad55' }}>Today's Attendance Summary</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ background: '#e6fffa', borderRadius: 8, padding: '16px 32px', textAlign: 'center', minWidth: 120 }}>
                  <div style={{ color: '#38b2ac', fontWeight: 800, fontSize: '1.5rem' }}>1</div>
                  <div style={{ color: '#38b2ac', fontWeight: 600 }}>Present</div>
                </div>
                <div style={{ background: '#fffbea', borderRadius: 8, padding: '16px 32px', textAlign: 'center', minWidth: 120 }}>
                  <div style={{ color: '#f6ad55', fontWeight: 800, fontSize: '1.5rem' }}>1</div>
                  <div style={{ color: '#f6ad55', fontWeight: 600 }}>Late</div>
                </div>
                <div style={{ background: '#ffeaea', borderRadius: 8, padding: '16px 32px', textAlign: 'center', minWidth: 120 }}>
                  <div style={{ color: '#ff4757', fontWeight: 800, fontSize: '1.5rem' }}>0</div>
                  <div style={{ color: '#ff4757', fontWeight: 600 }}>Absent</div>
                </div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(90deg, #2196F3 0%, #38b2ac 100%)', borderRadius: 10, padding: '20px 32px', color: '#fff', fontWeight: 600, fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(33,150,243,0.10)', textAlign: 'center' }}>
              <span>📅 Latest school update: Parent-Teacher meeting on <b>September 15, 2025</b>.</span>
            </div>
          </div>
        )}
        {activeSection === 'students' && (
          <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8, fontWeight: 800, color: '#2196F3', letterSpacing: 1 }}>Linked Students</h2>
            <p style={{ marginBottom: 24, fontSize: '1.1rem', color: '#2d3e50', fontWeight: 500 }}>View and manage your connected students here.</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {linkedStudents.length === 0 ? (
                <div style={{ color: '#888', fontWeight: 600 }}>No linked students found.</div>
              ) : (
                linkedStudents.map(student => (
                  <div key={student._id || student.studentId} style={{ flex: '1 1 260px', background: 'linear-gradient(135deg, #38b2ac 0%, #2196F3 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(33,150,243,0.10)', color: '#fff', minWidth: 220, position: 'relative', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                      <img src={student.photo && student.photo.trim() !== '' ? student.photo : '/spcclogo.png'} alt="Student Avatar" style={{ width: 54, height: 54, borderRadius: '50%', marginRight: 18, border: '3px solid #fff', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{student.fullName}</div>
                        <div style={{ fontWeight: 500, fontSize: '1rem', color: '#e6fffa' }}>{student.section || student.sectionName || '-'}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>Status: <span style={{ color: '#e6fffa' }}>Active</span></div>
                    <button style={{ background: '#fff', color: '#2196F3', borderRadius: 8, padding: '8px 18px', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: 8 }} onClick={() => setSelectedStudentId(student._id || student.studentId)}>View Details</button>
                  </div>
                ))
              )}
            </div>
            {/* Show student details if selected */}
            {selectedStudentId && linkedStudents.some(s => (s._id || s.studentId) === selectedStudentId) && (
              linkedStudents.filter(s => (s._id || s.studentId) === selectedStudentId).map(student => (
                <>
                  {/* Overlay */}
                  <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(33, 150, 243, 0.18)',
                    zIndex: 1000,
                    animation: 'fadeInOverlay 0.3s'
                  }} onClick={()=>setSelectedStudentId(null)} />
                  {/* Details Card */}
                  <div key={student._id || student.studentId}
                    style={{
                      marginTop: 24,
                      background: '#fff',
                      borderRadius: 16,
                      padding: '40px 48px',
                      boxShadow: '0 8px 32px rgba(33,150,243,0.18)',
                      maxWidth: 520,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) scale(1)',
                      zIndex: 1001,
                      animation: 'slideInCard 0.35s cubic-bezier(.4,1.6,.6,1)'
                    }}
                    tabIndex={0}
                    aria-modal="true"
                    role="dialog"
                  >
                    <button
                      onClick={()=>setSelectedStudentId(null)}
                      aria-label="Close details"
                      style={{
                        position:'absolute',
                        top:18,
                        right:18,
                        background:'#ff4757',
                        color:'#fff',
                        border:'none',
                        borderRadius:'50%',
                        width:36,
                        height:36,
                        fontWeight:900,
                        fontSize:22,
                        boxShadow:'0 2px 8px rgba(255,71,87,0.13)',
                        cursor:'pointer',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        transition:'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background='#e84118'}
                      onMouseOut={e => e.currentTarget.style.background='#ff4757'}
                    >
                      ×
                    </button>
                    <div style={{display:'flex',alignItems:'center',gap:36,marginBottom:28}}>
                      <img src={student.photo && student.photo.trim() !== '' ? student.photo : '/spcclogo.png'} alt="Student" style={{width:110,height:110,borderRadius:'50%',objectFit:'cover',background:'#e3f2fd',border:'3px solid #2196F3',boxShadow:'0 2px 12px #e3f2fd'}} />
                      <div>
                        <div style={{fontSize:28,fontWeight:800,marginBottom:10,letterSpacing:0.5}}>{student.fullName || student.name}</div>
                        <div style={{fontSize:17,color:'#555',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:18,marginRight:4}}>🏫</span>
                          <b>Section:</b> {student.section || student.sectionName || '-'}
                        </div>
                        <div style={{fontSize:17,color:'#555',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:18,marginRight:4}}>🆔</span>
                          <b>Student ID:</b> {student.studentId || student._id}
                        </div>
                      </div>
                    </div>
                    <hr style={{border:'none',borderTop:'1.5px solid #e3f2fd',margin:'18px 0 20px 0'}} />
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:18,color:'#333',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:20,marginRight:4}}>✅</span>
                        <b>Status:</b> <span style={{color:'#38b2ac',fontWeight:700}}>Active</span>
                      </div>
                    </div>
                  </div>
                  {/* Animations */}
                  <style>{`
                    @keyframes fadeInOverlay {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                    @keyframes slideInCard {
                      from { opacity: 0; transform: translate(-50%, -60%) scale(0.97); }
                      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    }
                  `}</style>
                </>
              ))
            )}
          
        </div>
      )}
      {activeSection === 'attendance' && (
          <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8, fontWeight: 800, color: '#2196F3', letterSpacing: 1 }}>Attendance Records</h2>
            <p style={{ marginBottom: 24, fontSize: '1.1rem', color: '#2d3e50', fontWeight: 500 }}>Check your students' attendance history and details.</p>
            <div style={{ boxShadow: '0 4px 24px rgba(33,150,243,0.10)', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 18, padding: '0', marginBottom: 32, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 600 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: 'linear-gradient(90deg, #2196F3 0%, #38b2ac 100%)', color: '#fff' }}>
                    <th style={{ padding: '16px 10px', fontWeight: 800, fontSize: '1.08rem', letterSpacing: 0.5, textAlign: 'left', position: 'sticky', top: 0, background: 'inherit' }}>Date</th>
                    <th style={{ padding: '16px 10px', fontWeight: 800, fontSize: '1.08rem', letterSpacing: 0.5, textAlign: 'left', position: 'sticky', top: 0, background: 'inherit' }}>Time</th>
                    <th style={{ padding: '16px 10px', fontWeight: 800, fontSize: '1.08rem', letterSpacing: 0.5, textAlign: 'left', position: 'sticky', top: 0, background: 'inherit' }}>Section</th>
                    <th style={{ padding: '16px 10px', fontWeight: 800, fontSize: '1.08rem', letterSpacing: 0.5, textAlign: 'left', position: 'sticky', top: 0, background: 'inherit' }}>Student</th>
                    <th style={{ padding: '16px 10px', fontWeight: 800, fontSize: '1.08rem', letterSpacing: 0.5, textAlign: 'left', position: 'sticky', top: 0, background: 'inherit' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888', fontWeight: 500, padding: 32 }}>No attendance records found.</td></tr>
                  ) : (
                    attendanceRecords.map((rec, idx) => {
                      const student = linkedStudents.find(s => (s._id || s.studentId) === (rec.studentId || rec.student_id || rec.student?._id));
                      if (!student) return null;
                      let badgeColor = '#38b2ac', badgeBg = '#e6fffa', badgeText = 'Present';
                      if (rec.status && rec.status.toLowerCase() === 'late') { badgeColor = '#f6ad55'; badgeBg = '#fffbea'; badgeText = 'Late'; }
                      else if (rec.status && rec.status.toLowerCase() === 'absent') { badgeColor = '#ff4757'; badgeBg = '#ffeaea'; badgeText = 'Absent'; }
                      else if (rec.status && rec.status.toLowerCase() === 'present') { badgeColor = '#38b2ac'; badgeBg = '#e6fffa'; badgeText = 'Present'; }
                      return (
                        <tr key={rec._id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f7fafc', transition: 'background 0.2s', cursor: 'pointer' }}
                          onMouseOver={e => e.currentTarget.style.background = '#e3f2fd'}
                          onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f7fafc'}>
                          <td style={{ padding: '14px 10px', fontWeight: 500 }}>{rec.date ? new Date(rec.date).toLocaleDateString() : '-'}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 500 }}>{rec.time || '-'}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 500 }}>{student.section || student.sectionName || '-'}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 500 }}>{student.fullName || student.name || '-'}</td>
                          <td style={{ padding: '14px 0', fontWeight: 700 }}>
                            <span style={{ color: badgeColor, background: badgeBg, borderRadius: 8, padding: '6px 18px', fontWeight: 800, fontSize: '1.01rem', letterSpacing: 0.5, boxShadow: '0 1px 4px rgba(33,150,243,0.07)' }}>{badgeText}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <style>{`
              @media (max-width: 700px) {
                .admin-main-content table { font-size: 0.97rem; }
                .admin-main-content th, .admin-main-content td { padding: 10px 4px !important; }
              }
            `}</style>
          </div>
        )}
        {activeSection === 'announcements' && (
          <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8, fontWeight: 800, color: '#2196F3', letterSpacing: 1 }}>Announcements</h2>
            <p style={{ marginBottom: 24, fontSize: '1.1rem', color: '#2d3e50', fontWeight: 500 }}>Stay updated with the latest school news and announcements.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Example announcement cards, replace with dynamic data as needed */}
              <div style={{ background: 'linear-gradient(135deg, #2196F3 0%, #38b2ac 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(33,150,243,0.10)', color: '#fff', position: 'relative' }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>Parent-Teacher Meeting</div>
                <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: 12 }}>September 15, 2025</div>
                <div style={{ fontWeight: 400, fontSize: '1rem', marginBottom: 12 }}>Join us for the Parent-Teacher meeting at the SPCC Auditorium. Your participation is important!</div>
                <span style={{ background: '#fffbea', color: '#f6ad55', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: '0.95rem', position: 'absolute', top: 24, right: 32 }}>Unread</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #38b2ac 0%, #2196F3 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(33,150,243,0.10)', color: '#fff', position: 'relative' }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>School Holiday</div>
                <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: 12 }}>September 20, 2025</div>
                <div style={{ fontWeight: 400, fontSize: '1rem', marginBottom: 12 }}>SPCC will be closed for a school holiday. Classes will resume on September 21.</div>
                <span style={{ background: '#e6fffa', color: '#38b2ac', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: '0.95rem', position: 'absolute', top: 24, right: 32 }}>Read</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ff4757 0%, #f6ad55 100%)', borderRadius: 14, padding: '24px 32px', boxShadow: '0 4px 24px rgba(255,71,87,0.10)', color: '#fff', position: 'relative' }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>Emergency Drill</div>
                <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: 12 }}>September 25, 2025</div>
                <div style={{ fontWeight: 400, fontSize: '1rem', marginBottom: 12 }}>There will be an emergency drill for all students and staff. Please follow instructions from teachers.</div>
                <span style={{ background: '#fffbea', color: '#f6ad55', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: '0.95rem', position: 'absolute', top: 24, right: 32 }}>Unread</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardParent;
